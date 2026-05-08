
const CLERK_SECRET_KEY = "sk_test_ea7WwBM1bpzrBL88mb1RIwGqltfV77nGAbNsZcJpMY";

async function checkInstance() {
  console.log("Buscando configurações da instância...");
  const response = await fetch("https://api.clerk.com/v1/instance", {
    headers: {
      'Authorization': `Bearer ${CLERK_SECRET_KEY}`,
      'Content-Type': 'application/json'
    }
  });

  const data = await response.json();
  console.log(JSON.stringify(data, null, 2));
}

checkInstance().catch(console.error);
