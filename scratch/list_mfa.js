
const CLERK_SECRET_KEY = "sk_test_ea7WwBM1bpzrBL88mb1RIwGqltfV77nGAbNsZcJpMY";
const USER_ID = "user_3DLtu8BH01ox3ccIxgAgun4I9wc";

async function listMfa() {
  console.log(`Buscando métodos MFA do usuário: ${USER_ID}...`);
  
  // No Clerk, não há um endpoint direto 'list MFA'. 
  // Mas podemos ver no objeto usuário.
  const response = await fetch(`https://api.clerk.com/v1/users/${USER_ID}`, {
    headers: {
      'Authorization': `Bearer ${CLERK_SECRET_KEY}`,
      'Content-Type': 'application/json'
    }
  });

  const user = await response.json();
  console.log("Totp Enabled:", user.totp_enabled);
  console.log("Backup Codes Enabled:", user.backup_codes_enabled);
  console.log("Two Factor Enabled:", user.two_factor_enabled);
  
  // Se houver algum, tentaremos desativar.
}

listMfa().catch(console.error);
