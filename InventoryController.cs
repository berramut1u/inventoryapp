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

        return Ok(items.Select(i => new {
            i.Id,
            i.Name,
            i.Quantity,
            i.Type,
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
        var item = new InventoryItem
        {
            Name = dto.Name,
            Quantity = dto.Quantity,
            Type = dto.Type,
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

    // GET: api/inventory/moves
    [HttpGet("moves"), Authorize]
    public async Task<IActionResult> GetMoves()
    {
        var flat = await _ctx.InventoryAudits
            .Include(a => a.InventoryItem)
            .Include(a => a.PerformedByUser)
            .OrderByDescending(a => a.Timestamp)
            .Select(a => new {
                id = a.InventoryItemId,
                name = a.InventoryItem!.Name,
                action = a.Action,
                performedBy = a.PerformedByUser!.Username,
                timestamp = a.Timestamp
            })
            .ToListAsync();
        return Ok(flat);
    }
}
