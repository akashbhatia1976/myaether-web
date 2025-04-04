// 📁 pages/index.js

export async function getServerSideProps(context) {
  const { req } = context;
  const cookies = req.cookies;
  const token = cookies.token;

  // If token exists, go to dashboard
  if (token) {
    return {
      redirect: {
        destination: "/dashboard",
        permanent: false,
      },
    };
  }

  // Otherwise go to login
  return {
    redirect: {
      destination: "/auth/login",
      permanent: false,
    },
  };
}

export default function RedirectHome() {
  // This will never render because getServerSideProps handles the redirect
  return null;
}

