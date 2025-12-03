export default function MenuButton({ onClick }) {
  return (
    <div 
      className="absolute top-3 left-3 w-fit bg-black opacity-60 p-2 z-40 rounded shadow-white shadow cursor-pointer hover:opacity-80 transition-opacity"
      onClick={onClick}
    >
      <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#e3e3e3">
        <path d="M120-240v-80h720v80H120Zm0-200v-80h720v80H120Zm0-200v-80h720v80H120Z" />
      </svg>
    </div>
  );
}
