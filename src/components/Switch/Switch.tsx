import type { CSSProperties } from 'react';
import { useState } from 'react';
import TooltipWrapper from '../TooltipWrapper/TooltipWrapperComponent';

interface ISwitch {
    isOn: boolean;
    iconOn?: React.ReactNode;
    iconOff?: React.ReactNode;
    tooltipTextOn?: string;
    tooltipTextOff?: string;
    styles?: CSSProperties;
    onToggle: (newState: boolean) => void;
}

const Switch: React.FC<ISwitch> = ({ isOn, iconOn, iconOff, tooltipTextOn, tooltipTextOff, styles, onToggle }) => {
    const [state, setState] = useState(isOn);

    const handleToggle = () => {
        const newState = !state;
        setState(newState);
        onToggle(newState); // Gọi callback để thông báo về trạng thái mới
    };

    return tooltipTextOn && tooltipTextOff ? (
        <div className={`switch ${state ? 'on' : 'off'}`} onClick={handleToggle} style={styles ?? {}}>
            <TooltipWrapper tooltipText={state ? tooltipTextOn : tooltipTextOff} position="left">
                <div className="switch-handle">
                    {iconOn && state && iconOn}
                    {iconOff && !state && iconOff}
                </div>
            </TooltipWrapper>
        </div>
    ) : (
        <div className={`switch ${state ? 'on' : 'off'}`} onClick={handleToggle} style={styles ?? {}}>
            <div className="switch-handle">
                {iconOn && state && iconOn}
                {iconOff && !state && iconOff}
            </div>
        </div>
    );
};

export default Switch;
