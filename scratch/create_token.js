
const CLERK_SECRET_KEY = "sk_test_ea7WwBM1bpzrBL88mb1RIwGqltfV77nGAbNsZcJpMY";
const USER_ID = "user_3DLtu8BH01ox3ccIxgAgun4I9wc";

async function createToken() {
  console.log(`Criando sign-in token para: ${USER_ID}...`);
  
  const response = await fetch(`https://api.clerk.com/v1/sign_in_tokens`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${CLERK_SECRET_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      user_id: USER_ID,
      expires_in_seconds: 3600 // 1 hour
    })
  });

  const data = await response.json();
  console.log("Token Data:", JSON.stringify(data, null, 2));
}

createToken().catch(console.error);
