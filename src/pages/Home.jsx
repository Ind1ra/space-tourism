import { useSelector } from "react-redux";

function Home() {
  const user = useSelector((state) => state.auth.user);

  return (
    <div className="container">
      <h1 style={{ textAlign: "center", marginBottom: "20px" }}>
        Welcome to Space Tourism
      </h1>
      {user ? (
        <p style={{ textAlign: "center", fontSize: "1.2rem" }}>
          Hello, {user.name}! You are logged in as <strong>{user.role}</strong>.
        </p>
      ) : (
        <p style={{ textAlign: "center", fontSize: "1.2rem" }}>
          Login or register to explore space adventures!
        </p>
      )}
    </div>
  );
}

export default Home;