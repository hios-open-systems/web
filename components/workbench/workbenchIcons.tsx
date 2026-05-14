import React from 'react';
import {
    ApartmentOutlined,
    DatabaseOutlined,
    FileTextOutlined,
    GlobalOutlined,
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
    network: <GlobalOutlined />,
};

export function getWorkbenchIcon(icon: WorkbenchIcon) {
    return iconMap[icon];
}