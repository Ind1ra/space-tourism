import { useSelector } from "react-redux";

function Home() {
  const user = useSelector((state) => state.auth.user);

  return (
    <div style={{ padding: "20px", background: "#0d0d1a", color: "white" }}>
      <h1>Welcome to Space Tourism</h1>
      {user ? (
        <p>
          Hello, {user.name}! You are logged in as <strong>{user.role}</strong>.
        </p>
      ) : (
        <p>Login or register to explore space adventures!</p>
      )}
    </div>
  );
}

export default Home;