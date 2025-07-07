using Microsoft.EntityFrameworkCore;

namespace inventoryapp.Data
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
            : base(options) { }

        public DbSet<User> Users { get; set; }

        public DbSet<InventoryItem> InventoryItems { get; set; }

        public DbSet<InventoryAudit> InventoryAudits { get; set; }
    }
}


public class User
{
    public int Id { get; set; }

    public string Username { get; set; } = string.Empty;

    // Store as hashed password using secure hashing (e.g. BCrypt)
    public string PasswordHash { get; set; } = string.Empty;
}

public class InventoryItem
{
    public int Id { get; set; }

    public string Name { get; set; } = string.Empty;

    public int Quantity { get; set; }

    public string Type { get; set; } = string.Empty; // e.g., "Laptop", "Cable", etc.

    public DateTime AddedDate { get; set; } = DateTime.UtcNow;

    // Optional: who added it (for audit)
    public int AddedByUserId { get; set; }
    public User? AddedByUser { get; set; }
}


public class InventoryAudit
{
    public int Id { get; set; }

    public int InventoryItemId { get; set; }

    public string Action { get; set; } = string.Empty; // e.g., "Added", "Updated", "Deleted"

    public int PerformedByUserId { get; set; }
    public User? PerformedByUser { get; set; }

    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
}
