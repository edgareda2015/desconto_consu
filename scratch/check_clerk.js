
const CLERK_SECRET_KEY = "sk_test_ea7WwBM1bpzrBL88mb1RIwGqltfV77nGAbNsZcJpMY";
const ADMIN_EMAIL = "edgareda2015@gmail.com";

async function checkUser() {
  console.log(`Buscando usuário: ${ADMIN_EMAIL}...`);
  
  const searchResponse = await fetch(`https://api.clerk.com/v1/users?email_address=${ADMIN_EMAIL}`, {
    headers: {
      'Authorization': `Bearer ${CLERK_SECRET_KEY}`,
      'Content-Type': 'application/json'
    }
  });

  const users = await searchResponse.json();
  
  if (!users || users.length === 0) {
    console.error("Usuário não encontrado.");
    return;
  }

  const user = users[0];
  console.log("Usuário ID:", user.id);
  console.log("Two Factor Enabled:", user.two_factor_enabled);
  console.log("Backup Codes Enabled:", user.backup_codes_enabled);
  
  // Detalhes dos e-mails
  console.log("E-mails:", JSON.stringify(user.email_addresses, null, 2));

  // Tentar encontrar por que está pedindo second factor
  // No Clerk, se two_factor_enabled for true, ele vai pedir.
  
  if (user.two_factor_enabled) {
    console.log("Tentando desativar Two Factor...");
    // A API do Clerk para desativar 2FA é remover os métodos de 2FA ou atualizar o usuário.
    // Infelizmente a API de PATCH /users/{id} não tem um campo direto para 'two_factor_enabled'.
    // Geralmente isso é controlado por configurações da instância ou métodos de verificação.
  }
}

checkUser().catch(console.error);
