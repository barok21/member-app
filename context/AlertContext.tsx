import React, { createContext, useContext, useState, useCallback } from 'react';
import { CustomAlert, AlertType, CustomAlertOptions } from '../components/CustomAlert';

type AlertContextType = {
  showAlert: (title: string, message: string, type?: AlertType, options?: CustomAlertOptions) => void;
  hideAlert: () => void;
};

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export function AlertProvider({ children }: { children: React.ReactNode }) {
  const [alertConfig, setAlertConfig] = useState<{
    visible: boolean;
    title: string;
    message: string;
    type: AlertType;
    options?: CustomAlertOptions;
  }>({
    visible: false,
    title: '',
    message: '',
    type: 'info',
  });

  const showAlert = useCallback((title: string, message: string, type: AlertType = 'info', options?: CustomAlertOptions) => {
    setAlertConfig({
      visible: true,
      title,
      message,
      type,
      options,
    });
  }, []);

  const hideAlert = useCallback(() => {
    setAlertConfig((prev) => ({ ...prev, visible: false }));
  }, []);

  return (
    <AlertContext.Provider value={{ showAlert, hideAlert }}>
      {children}
      <CustomAlert
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        options={alertConfig.options}
        onClose={hideAlert}
      />
    </AlertContext.Provider>
  );
}

export function useAlert() {
  const context = useContext(AlertContext);
  if (context === undefined) {
    throw new Error('useAlert must be used within an AlertProvider');
  }
  return context;
}
