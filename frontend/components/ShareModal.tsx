import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

interface ShareModalProps {
  visible: boolean;
  onClose: () => void;
  onQRCode: () => void;
  onEmail: () => void;
  onCopyLink: () => void;
  onInstagram: () => void;
}

export default function ShareModal({
  visible,
  onClose,
  onQRCode,
  onEmail,
  onCopyLink,
  onInstagram,
}: ShareModalProps) {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <View style={styles.header}>
            <Text style={styles.title}>Share to...</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <View style={styles.closeButtonContainer}>
                <Ionicons name="close" size={20} color="#fff" />
              </View>
            </TouchableOpacity>
          </View>
          
          <View style={styles.content}>
            <TouchableOpacity
              style={styles.option}
              onPress={() => {
                onQRCode();
                onClose();
              }}
            >
              <Ionicons name="qr-code-outline" size={24} color="#000" />
              <Text style={styles.optionText}>QR code</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.option}
              onPress={() => {
                onEmail();
                onClose();
              }}
            >
              <Ionicons name="mail-outline" size={24} color="#000" />
              <Text style={styles.optionText}>Share via Email</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.option}
              onPress={() => {
                onCopyLink();
                onClose();
              }}
            >
              <Ionicons name="link-outline" size={24} color="#000" />
              <Text style={styles.optionText}>Copy link</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.option}
              onPress={() => {
                onInstagram();
                onClose();
              }}
            >
              <Ionicons name="logo-instagram" size={24} color="#000" />
              <Text style={styles.optionText}>Share to Instagram</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  closeButton: {
    padding: 5,
  },
  closeButtonContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 20,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
  },
  optionText: {
    fontSize: 16,
    color: '#000',
    marginLeft: 16,
  },
});

