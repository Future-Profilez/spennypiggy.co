// Temporary disabled MagicBell component to isolate JSX runtime issues
const MagicBellNotificationDisabled = () => {
    return (
        <div className='sm:relative'>
            {/* MagicBell temporarily disabled to fix JSX runtime conflicts */}
            <div style={{
                padding: '8px 12px',
                backgroundColor: '#f97316',
                color: 'white',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: '500'
            }}>
                🔔 Notifications temporarily disabled
            </div>
        </div>
    );
};

export default MagicBellNotificationDisabled;
