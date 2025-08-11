import React, { useState, useRef } from 'react';
import Icon from './Icon';

interface CollapsibleProps {
    title: string;
    children: React.ReactNode;
    startOpen?: boolean;
    badgeCount?: number;
}

const Collapsible: React.FC<CollapsibleProps> = ({ title, children, startOpen = false, badgeCount }) => {
    const [isOpen, setIsOpen] = useState(startOpen);
    const contentRef = useRef<HTMLDivElement>(null);

    const toggleOpen = () => {
        setIsOpen(!isOpen);
    };

    return (
        <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
            <button
                onClick={toggleOpen}
                className="w-full text-left text-2xl font-semibold text-gray-200 flex justify-between items-center"
                aria-expanded={isOpen}
            >
                <span>
                    {title}
                    {badgeCount !== undefined && badgeCount > 0 && (
                        <span className="ml-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">{badgeCount}</span>
                    )}
                </span>
                <Icon name="chevron-down" className={`transform transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            <div
                ref={contentRef}
                className={`collapsible-content mt-6 ${isOpen ? 'open' : ''}`}
                style={{ maxHeight: isOpen ? contentRef.current?.scrollHeight + "px" : "0px" }}
            >
                {children}
            </div>
        </div>
    );
};

export default Collapsible;
