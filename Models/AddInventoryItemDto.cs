namespace inventoryapp.Models
{
    public class AddInventoryItemDto
    {
        public string Name { get; set; } = string.Empty;
        public int Quantity { get; set; }
        public string Type { get; set; } = string.Empty;
        public int ReorderThreshold { get; set; }
    }
}
