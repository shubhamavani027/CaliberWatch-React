import Swal from 'sweetalert2';

const popupClassNameByIcon = {
  success: 'lux-alert-popup lux-alert-popup--success',
  error: 'lux-alert-popup lux-alert-popup--error',
  info: 'lux-alert-popup lux-alert-popup--info',
  warning: 'lux-alert-popup lux-alert-popup--warning',
  question: 'lux-alert-popup lux-alert-popup--question',
};

const defaultCustomClass = {
  popup: 'lux-alert-popup',
  title: 'lux-alert-title',
  htmlContainer: 'lux-alert-html',
  confirmButton: 'lux-alert-confirm',
  cancelButton: 'lux-alert-cancel',
  actions: 'lux-alert-actions',
  icon: 'lux-alert-icon',
  closeButton: 'lux-alert-close',
};

const appSwal = Swal.mixin({
  buttonsStyling: false,
  backdrop: 'rgba(4, 4, 4, 0.78)',
  customClass: defaultCustomClass,
});

export function showAppAlert(options) {
  const icon = options?.icon;
  const popupClassName = popupClassNameByIcon[icon] || 'lux-alert-popup';

  return appSwal.fire({
    confirmButtonText: 'Continue',
    ...options,
    customClass: {
      ...defaultCustomClass,
      ...options?.customClass,
      popup: `${popupClassName}${options?.customClass?.popup ? ` ${options.customClass.popup}` : ''}`,
    },
  });
}

export function showAuthSuccessAlert(title, text, confirmButtonText = 'Enter Store') {
  return showAppAlert({
    title,
    text,
    confirmButtonText,
    customClass: {
      popup: 'lux-alert-popup lux-alert-popup--success lux-alert-popup--authSuccess',
    },
  });
}

export function showErrorAlert(title, text) {
  return showAppAlert({
    icon: 'error',
    title,
    text,
    confirmButtonText: 'Close',
  });
}

export function showInfoAlert(title, text, confirmButtonText = 'OK') {
  return showAppAlert({
    icon: 'info',
    title,
    text,
    confirmButtonText,
  });
}
