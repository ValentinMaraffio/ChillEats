import type { NativeStackScreenProps } from "@react-navigation/native-stack"
import type { RootStackParamList } from "../../types/navigation"

export type ProfileProps = NativeStackScreenProps<RootStackParamList, "Profile">

export const handleUserLogout = (logout: () => void) => {
  logout()
}
