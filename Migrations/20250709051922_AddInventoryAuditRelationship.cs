using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace inventoryapp.Migrations
{
    /// <inheritdoc />
    public partial class AddInventoryAuditRelationship : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateIndex(
                name: "IX_InventoryAudits_InventoryItemId",
                table: "InventoryAudits",
                column: "InventoryItemId");

            migrationBuilder.AddForeignKey(
                name: "FK_InventoryAudits_InventoryItems_InventoryItemId",
                table: "InventoryAudits",
                column: "InventoryItemId",
                principalTable: "InventoryItems",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_InventoryAudits_InventoryItems_InventoryItemId",
                table: "InventoryAudits");

            migrationBuilder.DropIndex(
                name: "IX_InventoryAudits_InventoryItemId",
                table: "InventoryAudits");
        }
    }
}
