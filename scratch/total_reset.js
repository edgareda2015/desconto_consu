
const CLERK_SECRET_KEY = "sk_test_ea7WwBM1bpzrBL88mb1RIwGqltfV77nGAbNsZcJpMY";
const ADMIN_EMAIL = "edgareda2015@gmail.com";
const NEW_PASSWORD = "Eda@#$2028";

async function resetUser() {
  console.log(`Iniciando reset total para: ${ADMIN_EMAIL}...`);
  
  // 1. Buscar o usuário atual
  const searchResponse = await fetch(`https://api.clerk.com/v1/users?email_address=${ADMIN_EMAIL}`, {
    headers: { 'Authorization': `Bearer ${CLERK_SECRET_KEY}` }
  });
  const users = await searchResponse.json();
  
  if (users && users.length > 0) {
    const userId = users[0].id;
    console.log(`Usuário encontrado (${userId}). Removendo para limpeza...`);
    
    // 2. Deletar o usuário antigo (para limpar qualquer estado de 2FA/Dispositivo)
    await fetch(`https://api.clerk.com/v1/users/${userId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${CLERK_SECRET_KEY}` }
    });
    console.log("Usuário antigo removido.");
  }

  // 3. Criar o usuário NOVO e LIMPO
  console.log("Criando nova conta limpa...");
  const createResponse = await fetch(`https://api.clerk.com/v1/users`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${CLERK_SECRET_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      email_address: [ADMIN_EMAIL],
      password: NEW_PASSWORD,
      skip_password_requirement: false,
      skip_password_checks: true
    })
  });

  const newUser = await createResponse.json();
  
  if (newUser.id) {
    console.log(`Sucesso! Nova conta criada ID: ${newUser.id}`);
    
    // 4. Marcar o e-mail como verificado para não pedir código
    const emailId = newUser.email_addresses[0].id;
    await fetch(`https://api.clerk.com/v1/email_addresses/${emailId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${CLERK_SECRET_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ verified: true, primary: true })
    });
    console.log("E-mail verificado com sucesso.");
    
    return newUser.id;
  } else {
    console.error("Erro ao criar usuário:", JSON.stringify(newUser));
  }
}

resetUser().then(id => {
  if (id) console.log("PROCEDIMENTO CONCLUÍDO. TENTE LOGAR AGORA.");
}).catch(console.error);
