
const CLERK_SECRET_KEY = "sk_test_ea7WwBM1bpzrBL88mb1RIwGqltfV77nGAbNsZcJpMY";
const ADMIN_EMAIL = "edgareda2015@gmail.com";

async function unlock() {
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
  console.log(`Usuário encontrado: ${user.id}`);

  // 1. Validar e-mails
  for (const emailObj of user.email_addresses) {
    if (emailObj.email_address === ADMIN_EMAIL && emailObj.verification.status !== 'verified') {
      console.log(`Validando e-mail: ${emailObj.email_address}...`);
      const updateEmailResponse = await fetch(`https://api.clerk.com/v1/email_addresses/${emailObj.id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${CLERK_SECRET_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          verified: true
        })
      });
      const emailData = await updateEmailResponse.json();
      console.log("Resultado validação e-mail:", emailData);
    }
  }

  // 2. Desativar 2FA / MFA se possível (geralmente removendo métodos de segundo fator)
  // Nota: Clerk não permite "desativar 2FA" globalmente via API de usuário de forma direta se for exigência da instância,
  // mas podemos garantir que o usuário não tenha nenhum método pendente ou forçado.
  
  console.log("Atualizando usuário para garantir que não haja flags de verificação pendentes...");
  const updateResponse = await fetch(`https://api.clerk.com/v1/users/${user.id}`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${CLERK_SECRET_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      skip_password_requirement: false, // Garante que a senha funcione
    })
  });

  const updateData = await updateResponse.json();
  console.log("Usuário atualizado:", updateData.id);
  
  console.log("\n--- SUCESSO ---");
  console.log("O e-mail foi marcado como verificado. Tente logar novamente.");
}

unlock().catch(console.error);
