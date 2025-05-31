import { useState, useEffect } from 'react'
import { Keyboard } from 'react-native'

export const useKeyboardVisibility = (): boolean => {
  const [isKeyboardVisible, setIsKeyboardVisible] = useState<boolean>(false)

  useEffect(() => {
    const showSubscription = Keyboard.addListener('keyboardDidShow', () => {
      setIsKeyboardVisible(true)
    })
    
    const hideSubscription = Keyboard.addListener('keyboardDidHide', () => {
      setIsKeyboardVisible(false)
    })

    // Cleanup function
    return () => {
      showSubscription.remove()
      hideSubscription.remove()
    }
  }, [])

  return isKeyboardVisible
}