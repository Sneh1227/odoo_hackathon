const { Client } = require("pg");

const passwords = [
  "postgres",
  "admin",
  "root",
  "123456",
  "1234",
  "password",
  "Poorav1234",
  "Poorav@1234",
  "Poorav@123",
  "Poorav123",
  "", // no password
];

async function testConnection() {
  for (const pwd of passwords) {
    console.log(`Testing password: "${pwd}"`);
    const client = new Client({
      host: "localhost",
      port: 5432,
      user: "postgres",
      password: pwd,
    });
    try {
      await client.connect();
      console.log(`SUCCESS! Connected with password: "${pwd}"`);
      await client.end();
      return pwd;
    } catch (err) {
      console.log(`Failed with password "${pwd}": ${err.message}`);
    }
  }
  console.log("None of the passwords worked.");
}

testConnection();
