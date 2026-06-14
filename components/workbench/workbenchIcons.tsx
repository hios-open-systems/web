import React from 'react';
import {
    ApartmentOutlined,
    ApiOutlined,
    AudioOutlined,
    DatabaseOutlined,
    FileTextOutlined,
    GlobalOutlined,
    SafetyCertificateOutlined,
    TableOutlined,
    ThunderboltOutlined,
    ToolOutlined,
} from '@ant-design/icons';
import type { WorkbenchIcon } from '@/config/workbench';

const iconMap: Record<WorkbenchIcon, React.ReactNode> = {
    audio: <AudioOutlined />,
    data: <DatabaseOutlined />,
    notes: <FileTextOutlined />,
    circuits: <ToolOutlined />,
    shield: <SafetyCertificateOutlined />,
    spark: <ThunderboltOutlined />,
    compare: <ApartmentOutlined />,
    network: <GlobalOutlined />,
    chip: <ApiOutlined />,
    table: <TableOutlined />,
};

export function getWorkbenchIcon(icon: WorkbenchIcon) {
    return iconMap[icon];
}
