using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using inventoryapp.Data;

[ApiController]
[Route("api/[controller]")]
public class InventoryController : ControllerBase
{
    private readonly ApplicationDbContext _ctx;

    public InventoryController(ApplicationDbContext ctx)
    {
        _ctx = ctx;
    }

    [HttpGet]
    [Authorize]
    public IActionResult GetItems()
    {
        var items = _ctx.InventoryItems.ToList(); // Assuming DbSet<Item> Items
        return Ok(items);
    }

    [HttpPost]
    [Authorize]
    public async Task<IActionResult> AddItem([FromBody] InventoryItem item)
    {
        // 1) Get the user ID from the JWT claims:
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier) ?? User.FindFirst("sub");
        if (userIdClaim == null) return Unauthorized();

        item.AddedByUserId = int.Parse(userIdClaim.Value);
        item.AddedDate = DateTime.UtcNow;

        _ctx.InventoryItems.Add(item);
        await _ctx.SaveChangesAsync();
        return Ok(item);
    }

    [HttpDelete("{id}")]
    [Authorize]
    public async Task<IActionResult> DeleteItem(int id)
    {
        var item = await _ctx.InventoryItems.FindAsync(id);
        if (item == null)
            return NotFound();

        _ctx.InventoryItems.Remove(item);
        await _ctx.SaveChangesAsync();
        return NoContent();
    }
}