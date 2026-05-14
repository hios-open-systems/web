import React from 'react';
import {
    ApartmentOutlined,
    DatabaseOutlined,
    FileTextOutlined,
    SafetyCertificateOutlined,
    ThunderboltOutlined,
    ToolOutlined,
} from '@ant-design/icons';
import type { WorkbenchIcon } from '@/config/workbench';

const iconMap: Record<WorkbenchIcon, React.ReactNode> = {
    data: <DatabaseOutlined />,
    notes: <FileTextOutlined />,
    circuits: <ToolOutlined />,
    shield: <SafetyCertificateOutlined />,
    spark: <ThunderboltOutlined />,
    compare: <ApartmentOutlined />,
};

export function getWorkbenchIcon(icon: WorkbenchIcon) {
    return iconMap[icon];
}