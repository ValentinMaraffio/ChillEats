"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import {
  View,
  Image,
  FlatList,
  TouchableOpacity,
  Text,
  StyleSheet,
  Dimensions,
  Modal,
  StatusBar,
  SafeAreaView,
  BackHandler,
  Platform,
} from "react-native"
import { Ionicons } from "@expo/vector-icons"

const { width, height } = Dimensions.get("window")

const getPhotoUrl = (photoReference: string, maxWidth: number): string => {
  const GOOGLE_API_KEY = "AIzaSyAf_jsZw6lt89DiMQ2pG_fwl8ckq24pRAU" 
  return `https://maps.googleapis.com/maps/api/place/photo?maxwidth=${maxWidth}&photoreference=${photoReference}&key=${GOOGLE_API_KEY}`
}

interface ImageViewerProps {
  photos: { photo_reference: string; height: number; width: number }[]
  visible: boolean
  onClose: () => void
  initialIndex?: number
}

const ImageViewer: React.FC<ImageViewerProps> = ({ photos, visible, onClose, initialIndex = 0 }) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex)
  const flatListRef = useRef<FlatList>(null)

  useEffect(() => {
    const backHandler = BackHandler.addEventListener("hardwareBackPress", () => {
      if (visible) {
        onClose()
        return true
      }
      return false
    })

    return () => backHandler.remove()
  }, [visible, onClose])

  useEffect(() => {
    if (visible && flatListRef.current && photos.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToIndex({
          index: initialIndex,
          animated: false,
        })
      }, 100)
    }
  }, [visible, initialIndex, photos.length])

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index)
    }
  }).current

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  }).current

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent={true}
    >
      <StatusBar backgroundColor="#000" barStyle="light-content" />
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
            hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
          >
            <Ionicons name="close" size={28} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.pageIndicator}>
            {currentIndex + 1} / {photos.length}
          </Text>
        </View>

        <FlatList
          ref={flatListRef}
          data={photos}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          initialScrollIndex={initialIndex}
          getItemLayout={(_, index) => ({
            length: width,
            offset: width * index,
            index,
          })}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          keyExtractor={(_, index) => `photo-${index}`}
          renderItem={({ item }) => (
            <View style={styles.imageContainer}>
              <Image
                source={{ uri: getPhotoUrl(item.photo_reference, 1200) }}
                style={styles.image}
                resizeMode="contain"
              />
            </View>
          )}
          onScrollToIndexFailed={(info) => {
            const wait = new Promise((resolve) => setTimeout(resolve, 500))
            wait.then(() => {
              if (flatListRef.current) {
                flatListRef.current.scrollToIndex({
                  index: info.index,
                  animated: false,
                })
              }
            })
          }}
        />

        <View style={styles.thumbnailContainer}>
          <FlatList
            data={photos}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(_, index) => `thumbnail-${index}`}
            renderItem={({ item, index }) => (
              <TouchableOpacity
                onPress={() => {
                  setCurrentIndex(index)
                  flatListRef.current?.scrollToIndex({
                    index,
                    animated: true,
                  })
                }}
                style={[styles.thumbnailButton, currentIndex === index && styles.activeThumbnail]}
              >
                <Image
                  source={{ uri: getPhotoUrl(item.photo_reference, 200) }}
                  style={styles.thumbnail}
                  resizeMode="cover"
                />
              </TouchableOpacity>
            )}
          />
        </View>
      </SafeAreaView>
    </Modal>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 15,
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight || 0 + 15 : 15,
  },
  closeButton: {
    padding: 5,
  },
  pageIndicator: {
    color: "#fff",
    fontSize: 16,
  },
  imageContainer: {
    width,
    height: height - 180, 
    justifyContent: "center",
    alignItems: "center",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  thumbnailContainer: {
    height: 80,
    paddingVertical: 10,
  },
  thumbnailButton: {
    width: 60,
    height: 60,
    marginHorizontal: 5,
    borderRadius: 5,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "transparent",
  },
  activeThumbnail: {
    borderColor: "#ff9500",
  },
  thumbnail: {
    width: "100%",
    height: "100%",
  },
})

export default ImageViewer