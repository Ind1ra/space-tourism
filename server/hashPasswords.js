const bcrypt = require("bcryptjs");
const fs = require("fs");

const data = require("./db.json");

async function hashPasswords() {
  data.users = await Promise.all(
    data.users.map(async (user) => {
      const salt = await bcrypt.genSalt(10); 
      const hashedPassword = await bcrypt.hash(user.password, salt);
      console.log(`Hashed password for ${user.name} (${user.role}): ${hashedPassword}`);
      return { ...user, password: hashedPassword };
    })
  );

  fs.writeFileSync("db.json", JSON.stringify(data, null, 2));
  console.log("All passwords (Admin, Traveller, Astronauts) have been successfully hashed and saved to db.json!");
}

hashPasswords().catch((err) => console.error("Error during hashing:", err));