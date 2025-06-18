using System;
using System.Threading.Tasks;
using Supabase;
using Supabase.Gotrue;
using Supabase.Realtime;
using System.Collections.Generic;
using Supabase.Postgrest.Models;
using Supabase.Postgrest.Attributes;

// Define a model for our 'stores' table.
[Table("stores")]
public class Store : BaseModel
{
    [PrimaryKey("id", false)]
    public Guid Id { get; set; }

    [Column("user_id")]
    public Guid UserId { get; set; }

    [Column("name")]
    public string Name { get; set; } = string.Empty;

    [Column("created_at")]
    public DateTime CreatedAt { get; set; }
}

public class Program
{
    // !!! IMPORTANT: REPLACE WITH YOUR SUPABASE PROJECT DETAILS !!!
    private static readonly string SupabaseUrl = "YOUR_SUPABASE_URL";
    private static readonly string SupabaseAnonKey = "YOUR_SUPABASE_ANON_KEY";

    private static Client? _supabase;
    private static User? _currentUser;

    public static async Task Main(string[] args)
    {
        Console.WriteLine("🚀 .NET 8 Supabase Integration Tester Initializing...");

        if (SupabaseUrl == "YOUR_SUPABASE_URL" || SupabaseAnonKey == "YOUR_SUPABASE_ANON_KEY")
        {
            Console.ForegroundColor = ConsoleColor.Red;
            Console.WriteLine("ERROR: Please update SupabaseUrl and SupabaseAnonKey in the code.");
            Console.ResetColor();
            return;
        }
        
        // Initialize the Supabase client.
        var options = new SupabaseOptions
        {
            AutoRefreshToken = true,
            AutoConnectRealtime = true
        };
        _supabase = new Client(SupabaseUrl, SupabaseAnonKey, options);
        await _supabase.InitializeAsync();
        
        Console.WriteLine("✅ Supabase client initialized.");

        bool isRunning = true;
        while (isRunning)
        {
            await ShowMenu();
            string? choice = Console.ReadLine();
            isRunning = await HandleChoice(choice);
        }

        Console.WriteLine("👋 Exiting tester. Goodbye!");
    }

    private static Task ShowMenu()
    {
        Console.WriteLine("\n--- MENU ---");
        if (_currentUser == null)
        {
            Console.WriteLine("1. Sign Up a new user");
            Console.WriteLine("2. Sign In with email and password");
        }
        else
        {
            Console.ForegroundColor = ConsoleColor.Green;
            Console.WriteLine($"Logged in as: {_currentUser.Email}");
            Console.ResetColor();
            Console.WriteLine("3. Sign Out");
            Console.WriteLine("--- Stores ---");
            Console.WriteLine("4. Create a new store");
            Console.WriteLine("5. Get my stores");
            Console.WriteLine("6. Update a store");
            Console.WriteLine("7. Delete a store");
        }
        Console.WriteLine("0. Exit");
        Console.Write("Enter your choice: ");
        return Task.CompletedTask;
    }

    private static async Task<bool> HandleChoice(string? choice)
    {
        switch (choice)
        {
            case "1": await HandleSignUp(); break;
            case "2": await HandleSignIn(); break;
            case "3": await HandleSignOut(); break;
            case "4": await HandleCreateStore(); break;
            case "5": await HandleGetStores(); break;
            case "6": await HandleUpdateStore(); break;
            case "7": await HandleDeleteStore(); break;
            case "0": return false;
            default: Console.WriteLine("Invalid choice, please try again."); break;
        }
        return true;
    }
    
    // --- Authentication Handlers ---
    private static async Task HandleSignUp()
    {
        Console.Write("Enter email for new user: ");
        string email = Console.ReadLine() ?? "";
        Console.Write("Enter password: ");
        string password = Console.ReadLine() ?? "";
        
        try
        {
            var session = await _supabase.Auth.SignUp(email, password);
            _currentUser = session?.User;
            Console.WriteLine(_currentUser != null ? $"✅ Sign up successful! User ID: {_currentUser.Id}" : "🚨 Sign up failed.");
        }
        catch (Exception ex)
        {
            Console.ForegroundColor = ConsoleColor.Red;
            Console.WriteLine($"Error during sign up: {ex.Message}");
            Console.ResetColor();
        }
    }
    
    private static async Task HandleSignIn()
    {
        Console.Write("Enter email to sign in: ");
        string email = Console.ReadLine() ?? "";
        Console.Write("Enter password: ");
        string password = Console.ReadLine() ?? "";

        try
        {
            var session = await _supabase.Auth.SignIn(email, password);
            _currentUser = session?.User;
            Console.WriteLine(_currentUser != null ? "✅ Sign in successful!" : "🚨 Sign in failed. Check credentials.");
        }
        catch (Exception ex)
        {
            Console.ForegroundColor = ConsoleColor.Red;
            Console.WriteLine($"Error during sign in: {ex.Message}");
            Console.ResetColor();
        }
    }
    
    private static async Task HandleSignOut()
    {
        try
        {
            await _supabase.Auth.SignOut();
            _currentUser = null;
            Console.WriteLine("✅ Signed out successfully.");
        }
        catch (Exception ex)
        {
            Console.ForegroundColor = ConsoleColor.Red;
            Console.WriteLine($"Error during sign out: {ex.Message}");
            Console.ResetColor();
        }
    }
    
    // --- Store (Database) Handlers ---
    private static async Task HandleCreateStore()
    {
        if (_currentUser == null) { Console.WriteLine("You must be logged in."); return; }
        
        Console.Write("Enter the name for the new store: ");
        string name = Console.ReadLine() ?? "";

        var newStore = new Store { Name = name, UserId = new Guid(_currentUser.Id) };
        
        try
        {
            var response = await _supabase.From<Store>().Insert(newStore);
            var createdStore = response.Models.FirstOrDefault();
            
            if (createdStore != null)
            {
                Console.WriteLine($"✅ Store '{createdStore.Name}' created with ID: {createdStore.Id}");
            }
            else
            {
                Console.WriteLine("🚨 Failed to create store.");
            }
        }
        catch (Exception ex)
        {
            Console.ForegroundColor = ConsoleColor.Red;
            Console.WriteLine($"Error creating store: {ex.Message}");
            Console.ResetColor();
        }
    }

    private static async Task HandleGetStores()
    {
        if (_currentUser == null) { Console.WriteLine("You must be logged in."); return; }

        try
        {
            var response = await _supabase.From<Store>().Get();
            var stores = response.Models;

            Console.WriteLine("\n--- Your Stores ---");
            if (stores.Count > 0)
            {
                foreach(var store in stores)
                {
                    Console.WriteLine($"- ID: {store.Id} | Name: {store.Name}");
                }
            }
            else
            {
                Console.WriteLine("No stores found. (This correctly tests RLS if you have stores owned by others!)");
            }
            Console.WriteLine("-------------------");
        }
        catch (Exception ex)
        {
            Console.ForegroundColor = ConsoleColor.Red;
            Console.WriteLine($"Error getting stores: {ex.Message}");
            Console.ResetColor();
        }
    }
    
    private static async Task HandleUpdateStore()
    {
        if (_currentUser == null) { Console.WriteLine("You must be logged in."); return; }

        Console.Write("Enter the ID of the store to update: ");
        string? idStr = Console.ReadLine();
        if (!Guid.TryParse(idStr, out Guid storeId))
        {
            Console.WriteLine("Invalid ID format.");
            return;
        }

        Console.Write("Enter the new name for the store: ");
        string newName = Console.ReadLine() ?? "";

        try
        {
            var update = await _supabase.From<Store>()
                .Where(s => s.Id == storeId)
                .Set(s => s.Name, newName)
                .Update();
            
            var updatedStore = update.Models.FirstOrDefault();
            if (updatedStore != null)
            {
                 Console.WriteLine($"✅ Store '{updatedStore.Name}' updated successfully.");
            }
            else
            {
                Console.WriteLine("🚨 Update failed. Check if you own the store (RLS test).");
            }
        }
        catch (Exception ex)
        {
             Console.ForegroundColor = ConsoleColor.Red;
            Console.WriteLine($"Error updating store: {ex.Message}");
            Console.ResetColor();
        }
    }
    
    private static async Task HandleDeleteStore()
    {
        if (_currentUser == null) { Console.WriteLine("You must be logged in."); return; }
        
        Console.Write("Enter the ID of the store to DELETE: ");
        string? idStr = Console.ReadLine();
        if (!Guid.TryParse(idStr, out Guid storeId))
        {
            Console.WriteLine("Invalid ID format.");
            return;
        }

        try
        {
            await _supabase.From<Store>().Where(s => s.Id == storeId).Delete();
            Console.WriteLine($"✅ Sent delete request for store ID: {storeId}. If you owned it, it's gone.");
        }
        catch (Exception ex)
        {
            Console.ForegroundColor = ConsoleColor.Red;
            Console.WriteLine($"Error deleting store: {ex.Message}");
            Console.ResetColor();
        }
    }
}