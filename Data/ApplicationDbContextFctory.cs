using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using inventoryapp.Data;      // ← adjust to match your namespace

public class ApplicationDbContextFactory
    : IDesignTimeDbContextFactory<ApplicationDbContext>
{
    public ApplicationDbContext CreateDbContext(string[] args)
    {
        var optionsBuilder = new DbContextOptionsBuilder<ApplicationDbContext>();
        optionsBuilder.UseSqlServer(
            "Server=localhost\\SQLEXPRESS;Database=MyAppDb;Trusted_Connection=True;TrustServerCertificate=True;"
        );

        return new ApplicationDbContext(optionsBuilder.Options);
    }
}
