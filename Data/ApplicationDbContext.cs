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

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // configure InventoryAudits → InventoryItems FK to Restrict deletes
            modelBuilder.Entity<InventoryAudit>()
                .HasOne(a => a.InventoryItem)
                .WithMany(i => i.Audits)
                .HasForeignKey(a => a.InventoryItemId)
                .OnDelete(DeleteBehavior.Restrict);
        }
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

    public bool IsDeleted { get; set; }
    public ICollection<InventoryAudit> Audits { get; set; } = new List<InventoryAudit>();

}


public class InventoryAudit
{
    public int Id { get; set; }

    public int InventoryItemId { get; set; }

    public InventoryItem? InventoryItem { get; set; }

    public string Action { get; set; } = string.Empty; // e.g., "Added", "Updated", "Deleted"

    public int PerformedByUserId { get; set; }
    public User? PerformedByUser { get; set; }

    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
}
