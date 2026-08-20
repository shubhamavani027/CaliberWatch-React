import React, { useMemo, useRef } from 'react';

function OtpInput({ value, onChange, length = 6, disabled = false }) {
  const inputRefs = useRef([]);

  const digits = useMemo(() => {
    const normalized = String(value || '').replace(/\D/g, '').slice(0, length);
    return Array.from({ length }, (_, index) => normalized[index] || '');
  }, [length, value]);

  const focusInput = (index) => {
    const next = inputRefs.current[index];
    if (next) next.focus();
  };

  const updateDigit = (index, nextDigit) => {
    const nextDigits = [...digits];
    nextDigits[index] = nextDigit;
    onChange(nextDigits.join(''));
  };

  const handleChange = (index, event) => {
    const cleaned = event.target.value.replace(/\D/g, '');
    if (!cleaned) {
      updateDigit(index, '');
      return;
    }

    const nextDigits = [...digits];
    const incoming = cleaned.slice(0, length - index).split('');
    incoming.forEach((digit, offset) => {
      nextDigits[index + offset] = digit;
    });
    onChange(nextDigits.join(''));

    const nextIndex = Math.min(index + incoming.length, length - 1);
    focusInput(nextIndex);
  };

  const handleKeyDown = (index, event) => {
    if (event.key === 'Backspace' && !digits[index] && index > 0) {
      event.preventDefault();
      updateDigit(index - 1, '');
      focusInput(index - 1);
      return;
    }

    if (event.key === 'ArrowLeft' && index > 0) {
      event.preventDefault();
      focusInput(index - 1);
    }

    if (event.key === 'ArrowRight' && index < length - 1) {
      event.preventDefault();
      focusInput(index + 1);
    }
  };

  const handlePaste = (event) => {
    event.preventDefault();
    const pasted = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
    if (!pasted) return;
    onChange(pasted);
    focusInput(Math.min(pasted.length - 1, length - 1));
  };

  return (
    <div className="otp-input" onPaste={handlePaste}>
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={(node) => {
            inputRefs.current[index] = node;
          }}
          className="otp-input__box"
          type="text"
          inputMode="numeric"
          autoComplete={index === 0 ? 'one-time-code' : 'off'}
          maxLength={length}
          value={digit}
          disabled={disabled}
          aria-label={`OTP digit ${index + 1}`}
          onChange={(event) => handleChange(index, event)}
          onKeyDown={(event) => handleKeyDown(index, event)}
          onFocus={(event) => event.target.select()}
        />
      ))}
    </div>
  );
}

export default OtpInput;
