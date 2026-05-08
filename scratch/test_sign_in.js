
const CLERK_SECRET_KEY = "sk_test_ea7WwBM1bpzrBL88mb1RIwGqltfV77nGAbNsZcJpMY";
const ADMIN_EMAIL = "edgareda2015@gmail.com";
const PASSWORD = "Eda@#$2028";

async function testSignIn() {
  console.log(`Testando login para: ${ADMIN_EMAIL}...`);
  
  // Tentar criar uma tentativa de sign-in via Backend
  // Nota: O backend não permite 'create sign-in' da mesma forma que o frontend, 
  // mas podemos verificar a senha.
  
  const response = await fetch(`https://api.clerk.com/v1/users?email_address=${ADMIN_EMAIL}`, {
    headers: { 'Authorization': `Bearer ${CLERK_SECRET_KEY}` }
  });
  const users = await response.json();
  
  if (!users || users.length === 0) {
    console.error("ERRO: Usuário não existe no Clerk!");
    return;
  }
  
  console.log("Usuário existe no Clerk com ID:", users[0].id);
  console.log("Status de verificação:", JSON.stringify(users[0].email_addresses[0].verification, null, 2));
}

testSignIn().catch(console.error);
