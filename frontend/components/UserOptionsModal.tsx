import React from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

interface UserOptionsModalProps {
  visible: boolean;
  onClose: () => void;
  onBlock: () => void;
  onRestrict: () => void;
  onReport: () => void;
  onShare: () => void;
  onAbout: () => void;
}

export default function UserOptionsModal({
  visible,
  onClose,
  onBlock,
  onRestrict,
  onReport,
  onShare,
  onAbout,
}: UserOptionsModalProps) {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <View style={styles.modalContainer}>
          <TouchableOpacity
            style={styles.option}
            onPress={() => {
              onBlock();
              onClose();
            }}
          >
            <Text style={styles.redOptionText}>Block</Text>
          </TouchableOpacity>
          
          <View style={styles.divider} />
          
          <TouchableOpacity
            style={styles.option}
            onPress={() => {
              onRestrict();
              onClose();
            }}
          >
            <Text style={styles.redOptionText}>Restrict</Text>
          </TouchableOpacity>
          
          <View style={styles.divider} />
          
          <TouchableOpacity
            style={styles.option}
            onPress={() => {
              onReport();
              onClose();
            }}
          >
            <Text style={styles.redOptionText}>Report</Text>
          </TouchableOpacity>
          
          <View style={styles.divider} />
          
          <TouchableOpacity
            style={styles.option}
            onPress={() => {
              onShare();
              onClose();
            }}
          >
            <Text style={styles.optionText}>Share to...</Text>
          </TouchableOpacity>
          
          <View style={styles.divider} />
          
          <TouchableOpacity
            style={styles.option}
            onPress={() => {
              onAbout();
              onClose();
            }}
          >
            <Text style={styles.optionText}>About this account</Text>
          </TouchableOpacity>
          
          <View style={styles.divider} />
          
          <TouchableOpacity
            style={styles.option}
            onPress={onClose}
          >
            <Text style={styles.optionText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
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
  option: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  optionText: {
    fontSize: 16,
    color: '#000',
  },
  redOptionText: {
    fontSize: 16,
    color: '#e65332',
  },
  divider: {
    height: 1,
    backgroundColor: '#e0e0e0',
  },
});




