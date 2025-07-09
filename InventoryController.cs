using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using Microsoft.EntityFrameworkCore;
using inventoryapp.Data;
using inventoryapp.Models;


[ApiController]
[Route("api/[controller]")]
public class InventoryController : ControllerBase
{
    private readonly ApplicationDbContext _ctx;

    public InventoryController(ApplicationDbContext ctx)
    {
        _ctx = ctx;
    }

    // GET: api/inventory
    [HttpGet]
    [Authorize]
    public async Task<IActionResult> GetItems()
    {
        var items = await _ctx.InventoryItems
            .Where(i => !i.IsDeleted)              //  only non‑deleted
            .Include(i => i.AddedByUser)
            .ToListAsync();

        return Ok(items.Select(i => new
        {
            i.Id,
            i.Name,
            i.Quantity,
            i.Type,
            i.AddedDate,
            AddedBy = i.AddedByUser?.Username ?? "Unknown"
        }));
    }


    // POST: api/inventory
    [HttpPost]
    [Authorize]
    public async Task<IActionResult> AddItem(
        [FromBody] AddInventoryItemDto dto)
    {
        // 1) Get user
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)
                       ?? User.FindFirst("sub");
        if (userIdClaim == null)
            return Unauthorized(new { error = "Invalid token" });
        var userId = int.Parse(userIdClaim.Value);

        // 2) Create the entity
        var item = new InventoryItem
        {
            Name = dto.Name,
            Quantity = dto.Quantity,
            Type = dto.Type,
            AddedByUserId = userId,
            AddedDate = DateTime.UtcNow
        };

        // 3) Track both the item and its audit
        _ctx.InventoryItems.Add(item);
        _ctx.InventoryAudits.Add(new InventoryAudit
        {
            InventoryItem = item,
            Action = "Added",
            PerformedByUserId = userId,
            Timestamp = DateTime.UtcNow
        });

        // 4) Flush both in one go
        try
        {
            await _ctx.SaveChangesAsync();
        }
        catch (Exception ex)
        {
            // log ex if you have ILogger, then:
            return StatusCode(500, new { error = "Database error: " + ex.Message });
        }

        // 5) Return 201 Created with the new item
        return CreatedAtAction(
            nameof(GetItems),
            null,
            new
            {
                item.Id,
                item.Name,
                item.Quantity,
                item.Type,
                item.AddedDate,
                AddedByUserId = item.AddedByUserId
            }
        );
    }


    [HttpDelete("{id}")]
    [Authorize]
    public async Task<IActionResult> DeleteItem(int id)
    {
        var item = await _ctx.InventoryItems.FindAsync(id);
        if (item == null)
            return NotFound();

        // 1) mark it deleted
        item.IsDeleted = true;

        // 2) record the delete in the audit table
        var userId = int.Parse(
           User.FindFirst(ClaimTypes.NameIdentifier)?.Value
              ?? User.FindFirst("sub")!.Value
        );
        _ctx.InventoryAudits.Add(new InventoryAudit
        {
            InventoryItem = item,
            Action = "Deleted",
            PerformedByUserId = userId,
            Timestamp = DateTime.UtcNow
        });

        await _ctx.SaveChangesAsync();
        return NoContent();
    }






    // GET api/inventory/moves
    [HttpGet("moves"), Authorize]
    public async Task<IActionResult> GetMoves()
    {
        var moves = await _ctx.InventoryItems
            // include even soft‑deleted items:
            .IgnoreQueryFilters()
            .Include(i => i.AddedByUser)
            .Include(i => i.Audits)
                .ThenInclude(a => a.PerformedByUser)
            .Select(i => new {
                id = i.Id,
                name = i.Name,
                quantity = i.Quantity,
                type = i.Type,
                addedDate = i.AddedDate,
                addedBy = i.AddedByUser!.Username,
                audits = i.Audits
                                .OrderByDescending(a => a.Timestamp)
                                .Select(a => new {
                                    action = a.Action,
                                    timestamp = a.Timestamp,
                                    performedBy = a.PerformedByUser!.Username
                                })
                                .ToArray()
            })
            .ToListAsync();

        return Ok(moves);
    }

}

