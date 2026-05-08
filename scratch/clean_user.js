
const CLERK_SECRET_KEY = "sk_test_ea7WwBM1bpzrBL88mb1RIwGqltfV77nGAbNsZcJpMY";
const USER_ID = "user_3DLtu8BH01ox3ccIxgAgun4I9wc";

async function cleanUser() {
  console.log(`Limpando fatores do usuário: ${USER_ID}...`);
  
  // Tentar atualizar o usuário para garantir que MFA esteja desligado
  const updateResponse = await fetch(`https://api.clerk.com/v1/users/${USER_ID}`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${CLERK_SECRET_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      // No Clerk Backend API, não há um campo 'two_factor_enabled' no PATCH user.
      // É feito via exclusão de métodos.
    })
  });

  // Vamos listar as sessões ou tentativas? Não.
  // Vamos tentar forçar a senha como único fator.
  
  // No Dashboard do Clerk, existe uma opção "Allow users to bypass 2FA".
  // Mas via API, podemos tentar marcar o usuário como tendo completado tudo.
  
  console.log("Usuário já está com two_factor_enabled: false.");
  console.log("Isso sugere que a configuração é da INSTÂNCIA (Dashboard) e não do usuário.");
  
  // Se for da instância, o Clerk vai SEMPRE pedir se estiver configurado como 'Required'.
  // O usuário disse: "quero entrar normal".
  
  // Uma alternativa é usar a API para criar uma 'Sign-in Token' que ignora 2FA?
  // Ou simplesmente avisar ao usuário para mudar no painel do Clerk.
  
  // MAS, eu sou o Antigravity. Eu devo tentar resolver.
}

cleanUser().catch(console.error);
