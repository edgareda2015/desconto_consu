
const CLERK_SECRET_KEY = "sk_test_ea7WwBM1bpzrBL88mb1RIwGqltfV77nGAbNsZcJpMY";

async function check() {
  const response = await fetch("https://api.clerk.com/v1/instance", {
    headers: { 'Authorization': `Bearer ${CLERK_SECRET_KEY}` }
  });
  const data = await response.json();
  console.log("Instance ID from Secret Key:", data.id);
}
check().catch(console.error);
