import { MdOutlineNightlight, MdOutlineWbSunny } from "react-icons/md"

const iconStyle = { fontSize: '0.6em', marginLeft: '5px', cursor: 'pointer', verticalAlign: 'top' }

export const DarkModeIndicator = ({ toggleTheme, isDarkMode }: { toggleTheme: () => void, isDarkMode: boolean }) => {
    return <>
        {
            isDarkMode ? <MdOutlineNightlight onClick={toggleTheme} style={iconStyle} />
                : <MdOutlineWbSunny onClick={toggleTheme} style={iconStyle} />
        }

    </>
}