using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using inventoryapp.Data;
using inventoryapp.Models;

[ApiController]
[Route("api/[controller]")]
public class InventoryController : ControllerBase
{
    private readonly ApplicationDbContext _ctx;
    public InventoryController(ApplicationDbContext ctx) => _ctx = ctx;

    // GET: api/inventory
    [HttpGet]
    [Authorize]
    public async Task<IActionResult> GetItems()
    {
        var items = await _ctx.InventoryItems
            .Where(i => !i.IsDeleted)
            .Include(i => i.AddedByUser)
            .ToListAsync();

        return Ok(items.Select(i => new
        {
            i.Id,
            i.Name,
            i.Quantity,
            i.Type,
            i.ReorderThreshold,
            i.AddedDate,
            AddedBy = i.AddedByUser!.Username
        }));
    }

    // POST: api/inventory
    [HttpPost]
    [Authorize]
    public async Task<IActionResult> AddItem([FromBody] AddInventoryItemDto dto)
    {
        var userId = int.Parse(
            User.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? User.FindFirst("sub")!.Value);

        // Normalize the incoming values once
        var name = dto.Name.Trim();
        var type = dto.Type.Trim();

        // Case‑insensitive, trimmed match
        var existing = await _ctx.InventoryItems
            .Where(i => !i.IsDeleted)
            .FirstOrDefaultAsync(i =>
                i.Name.ToLower() == name.ToLower() &&
                i.Type.ToLower() == type.ToLower()
            );

        if (existing != null)
        {
            // Merge: bump the quantity
            existing.Quantity += dto.Quantity;

            _ctx.InventoryAudits.Add(new InventoryAudit
            {
                InventoryItemId = existing.Id,
                Action = $"Added (merged) +{dto.Quantity}",
                PerformedByUserId = userId,
                Timestamp = DateTime.UtcNow
            });

            await _ctx.SaveChangesAsync();

            // Return OK so the front‑end fetch will show the updated quantity
            return Ok(new
            {
                existing.Id,
                existing.Name,
                existing.Quantity,
                existing.Type,
                existing.AddedDate
            });
        }
        else
        {
            // No match → insert brand‑new
            var item = new InventoryItem
            {
                Name = name,
                Quantity = dto.Quantity,
                Type = type,
                ReorderThreshold = dto.ReorderThreshold,
                AddedByUserId = userId,
                AddedDate = DateTime.UtcNow
            };
            _ctx.InventoryItems.Add(item);
            _ctx.InventoryAudits.Add(new InventoryAudit
            {
                InventoryItem = item,
                Action = "Added",
                PerformedByUserId = userId,
                Timestamp = DateTime.UtcNow
            });
            await _ctx.SaveChangesAsync();

            return CreatedAtAction(nameof(GetItems), null, new
            {
                item.Id,
                item.Name,
                item.Quantity,
                item.Type,
                item.AddedDate
            });
        }
    }


    // PUT: api/inventory/{id}
    [HttpPut("{id}")]
    [Authorize]
    public async Task<IActionResult> UpdateItem(int id, [FromBody] UpdateInventoryItemDto dto)
    {
        var item = await _ctx.InventoryItems.FindAsync(id);
        if (item == null) return NotFound();

        item.Name = dto.Name;
        item.Quantity = dto.Quantity;
        item.Type = dto.Type;
        item.ReorderThreshold = dto.ReorderThreshold;

        var userId = int.Parse(
          User.FindFirst(ClaimTypes.NameIdentifier)?.Value
          ?? User.FindFirst("sub")!.Value);
        _ctx.InventoryAudits.Add(new InventoryAudit
        {
            InventoryItemId = item.Id,
            Action = "Updated",
            PerformedByUserId = userId,
            Timestamp = DateTime.UtcNow
        });
        await _ctx.SaveChangesAsync();
        return NoContent();
    }

    // DELETE: api/inventory/{id}
    [HttpDelete("{id}")]
    [Authorize]
    public async Task<IActionResult> DeleteItem(int id)
    {
        var item = await _ctx.InventoryItems.FindAsync(id);
        if (item == null) return NotFound();

        item.IsDeleted = true;
        var userId = int.Parse(
          User.FindFirst(ClaimTypes.NameIdentifier)?.Value
          ?? User.FindFirst("sub")!.Value);
        _ctx.InventoryAudits.Add(new InventoryAudit
        {
            InventoryItemId = item.Id,
            Action = "Deleted",
            PerformedByUserId = userId,
            Timestamp = DateTime.UtcNow
        });
        await _ctx.SaveChangesAsync();
        return NoContent();
    }

    // GET: api/inventory/{id}/moves
    [HttpGet("{id}/moves"), Authorize]
    public async Task<IActionResult> GetMovesForItem(int id)
    {
        // ensure the item exists (and isn’t deleted)
        var item = await _ctx.InventoryItems
            .AsNoTracking()
            .FirstOrDefaultAsync(i => i.Id == id && !i.IsDeleted);
        if (item == null) return NotFound();

        var audits = await _ctx.InventoryAudits
            .Where(a => a.InventoryItemId == id)
            .Include(a => a.PerformedByUser)
            .OrderByDescending(a => a.Timestamp)
            .Select(a => new
            {
                a.Id,
                a.Action,
                performedBy = a.PerformedByUser!.Username,
                a.Timestamp
            })
            .ToListAsync();

        return Ok(new
        {
            item = new { item.Id, item.Name, item.Type },
            moves = audits
        });
    }

    // POST: api/inventory/{id}/moves
    [HttpPost("{id}/move"), Authorize]
    public async Task<IActionResult> MoveStock(int id, [FromBody] InventoryMoveDto dto)
    {
        // 1) find the item
        var item = await _ctx.InventoryItems.FindAsync(id);
        if (item == null || item.IsDeleted)
            return NotFound();

        // 2) validate
        if (dto.Amount <= 0 ||
           (dto.Direction != "In" && dto.Direction != "Out"))
        {
            return BadRequest("Amount must be > 0 and Direction either 'In' or 'Out'.");
        }

        // 3) apply the move
        if (dto.Direction == "Out")
        {
            if (item.Quantity < dto.Amount)
                return BadRequest("Not enough stock to remove.");
            item.Quantity -= dto.Amount;
        }
        else // "In"
        {
            item.Quantity += dto.Amount;
        }

        // 4) audit
        var userId = int.Parse(
          User.FindFirst(ClaimTypes.NameIdentifier)?.Value
          ?? User.FindFirst("sub")!.Value);

        _ctx.InventoryAudits.Add(new InventoryAudit
        {
            InventoryItemId = item.Id,
            Action = $"{dto.Direction} {dto.Amount}"
                   + (string.IsNullOrWhiteSpace(dto.Reason) ? "" : $" ({dto.Reason!.Trim()})"),
            PerformedByUserId = userId,
            Timestamp = DateTime.UtcNow
        });

        await _ctx.SaveChangesAsync();

        // 5) return the updated item
        return Ok(new
        {
            item.Id,
            item.Name,
            item.Type,
            item.Quantity,
            item.ReorderThreshold,
            item.AddedDate
        });
    }

}

