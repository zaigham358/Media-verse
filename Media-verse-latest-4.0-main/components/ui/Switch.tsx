import React from 'react';

interface SwitchProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Switch: React.FC<SwitchProps> = ({ id, checked, onChange, disabled, ...props }) => {
  return (
    <label htmlFor={id} className={`relative inline-flex items-center cursor-pointer ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
      <input 
        type="checkbox" 
        id={id} 
        className="sr-only peer"
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        {...props}
      />
      <div className="w-11 h-6 bg-gray-600 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
    </label>
  );
};

export default Switch;
