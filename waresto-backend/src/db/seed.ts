import { db } from "../config/db.js";
import { user, account, session, categories, menus, menuOptions, tables, restaurantProfile } from "./schema.js";
import { auth } from "../config/auth.js";

async function seed() {
  console.log("🌱 Seeding database...");

  console.log("Clearing existing data...");
  await db.delete(session);
  await db.delete(account);
  await db.delete(user);
  await db.delete(menuOptions);
  await db.delete(menus);
  await db.delete(categories);
  await db.delete(tables);
  await db.delete(restaurantProfile);
  console.log("✅ Data cleared.");

  try {
    // Create Admin
    console.log("Creating Admin user...");
    await auth.api.signUpEmail({
      body: {
        email: "admin@waresto.com",
        password: "admin123",
        name: "Administrator",
      },
    });
    console.log("✅ Admin created.");
  } catch (err: any) {
    console.log("ℹ️ Admin already exists or error occurred, skipping user creation...");
  }

  try {
    // Create Cashier
    console.log("Creating Cashier user...");
    await auth.api.signUpEmail({
      body: {
        email: "kasir@waresto.com",
        password: "kasir123",
        name: "Kasir Utama",
      },
    });
    console.log("✅ Cashier created.");
  } catch (err: any) {
    console.log("ℹ️ Cashier already exists or error occurred, skipping user creation...");
  }

  // Create Restaurant Profile
  console.log("Creating Restaurant Profile...");
  await db.insert(restaurantProfile).values({
    name: "Ayam Lumion",
    subtitle: "Pedesnya Bikin Nagih!",
    address: "Jl. Raya No. 123, Jakarta",
    rating: "4.8",
    reviewCount: 150,
  });

  // Create Categories
  console.log("Creating Categories...");
  const catNames = ["MENU REKOMENDASI", "BEBEK & AYAM", "PAKET HEMAT", "MINUMAN", "SAMBAL"];
  const insertedCats = await db.insert(categories).values(
    catNames.map((name, index) => ({ name, sortOrder: index }))
  ).returning();

  const catMap = Object.fromEntries(insertedCats.map(c => [c.name, c.id]));

  // Create Menus
  console.log("Creating Menus...");
  const menuData = [
    {
      name: 'Bebek Goreng Spesial',
      description: 'Bebek goreng dengan bumbu rahasia yang meresap, disajikan dengan nasi hangat and sambal.',
      price: "40000",
      categoryId: catMap['MENU REKOMENDASI'],
      imageUrl: 'https://images.unsplash.com/photo-1516684669134-de6f7c473a2a?w=800&auto=format&fit=crop',
      options: [
        { name: 'Level Pedas', choices: [{ name: 'Tidak Pedas', price: 0 }, { name: 'Sedang', price: 0 }, { name: 'Pedas Mampus', price: 0 }], required: true },
        { name: 'Pilihan Bagian', choices: [{ name: 'Paha', price: 0 }, { name: 'Dada', price: 0 }], required: false }
      ]
    },
    {
      name: 'Sate Bebek',
      description: 'Sate daging bebek pilihan dengan bumbu kacang yang gurih.',
      price: "23000",
      categoryId: catMap['MENU REKOMENDASI'],
      imageUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=800&auto=format&fit=crop',
      options: [
        { name: 'Bumbu', choices: [{ name: 'Kacang', price: 0 }, { name: 'Kecap', price: 0 }], required: true }
      ]
    },
    {
      name: 'Ayam Penyet',
      description: 'Ayam penyet dengan sambal pedas nendang.',
      price: "25000",
      categoryId: catMap['BEBEK & AYAM'],
      imageUrl: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=800&auto=format&fit=crop',
    },
    {
      name: 'Es Teh Manis',
      description: 'Teh melati segar dengan gula asli.',
      price: "5000",
      categoryId: catMap['MINUMAN'],
      imageUrl: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=800&auto=format&fit=crop',
    },
    {
      name: 'Es Jeruk',
      description: 'Jeruk peras segar.',
      price: "8000",
      categoryId: catMap['MINUMAN'],
      imageUrl: 'https://images.unsplash.com/photo-1613478223719-2ab802602423?w=800&auto=format&fit=crop',
    }
  ];

  for (const item of menuData) {
    const { options, ...menuFields } = item;
    const [insertedMenu] = await db.insert(menus).values(menuFields).returning();
    
    if (options && insertedMenu) {
      await db.insert(menuOptions).values(
        options.map(opt => ({
          menuId: insertedMenu.id,
          name: opt.name,
          choices: opt.choices,
          required: opt.required
        }))
      );
    }
  }
  console.log("✅ Menus created.");

  // Create Tables
  console.log("Creating Tables...");
  await db.insert(tables).values(
    Array.from({ length: 8 }, (_, i) => ({
      number: (i + 1).toString(),
      status: i % 3 === 0 ? 'terisi' : 'kosong' as any,
    }))
  );
  console.log("✅ Tables created.");

  console.log("✅ Seeding process completed!");
  process.exit(0);
}

seed().catch((err) => {
  console.error("❌ Seeding failed:", err);
  process.exit(1);
});

