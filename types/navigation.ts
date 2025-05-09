export type RootStackParamList = {
  Main: undefined;
  Login: undefined;
  Register: undefined;
  Favorites: undefined;
  Verification: { email: string };  // Asegúrate de que el tipo de email esté correcto
  Profile: {
    username: string;
    email: string;
  };
};
