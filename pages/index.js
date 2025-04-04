// 📁 pages/index.js

export async function getServerSideProps(context) {
  const token = context.req.cookies.token;

  if (!token) {
    return {
      redirect: {
        destination: "/auth/login",
        permanent: false,
      },
    };
  }

  return {
    redirect: {
      destination: "/dashboard",
      permanent: false,
    },
  };
}

export default function IndexRedirect() {
  return null; // This won't render because of SSR redirect
}
