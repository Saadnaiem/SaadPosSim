import React from 'react';

interface BarcodeDisplayProps {
  value: string;
}

const BarcodeDisplay: React.FC<BarcodeDisplayProps> = ({ value }) => {
  // Code 39 mapping
  // 0 = narrow space, 1 = wide space
  // b = narrow bar, B = wide bar
  const CODE39_MAP: Record<string, string> = {
    '0': 'b0b1B0B0b', '1': 'B0b1b0b0B', '2': 'b0B1b0b0B', '3': 'B0B1b0b0b',
    '4': 'b0b1B0b0B', '5': 'B0b1B0b0b', '6': 'b0B1B0b0b', '7': 'b0b1b0B0B',
    '8': 'B0b1b0B0b', '9': 'b0B1b0B0b',
    'A': 'B0b0b1b0B', 'B': 'b0B0b1b0B', 'C': 'B0B0b1b0b', 'D': 'b0b0B1b0B',
    'E': 'B0b0B1b0b', 'F': 'b0B0B1b0b', 'G': 'b0b0b1B0B', 'H': 'B0b0b1B0b',
    'I': 'b0B0b1B0b', 'J': 'b0b0B1B0b', 'K': 'B0b0b0b1B', 'L': 'b0B0b0b1B',
    'M': 'B0B0b0b1b', 'N': 'b0b0B0b1B', 'O': 'B0b0B0b1b', 'P': 'b0B0B0b1b',
    'Q': 'b0b0b0B1B', 'R': 'B0b0b0B1b', 'S': 'b0B0b0B1b', 'T': 'b0b0B0B1b',
    'U': 'B1b0b0b0B', 'V': 'b1B0b0b0B', 'W': 'B1B0b0b0b', 'X': 'b1b0B0b0B',
    'Y': 'B1b0B0b0b', 'Z': 'b1B0B0b0b',
    '-': 'b1b0b0B0B', '.': 'B1b0b0B0b', ' ': 'b1B0b0B0b', '*': 'b1b0B0B0b',
    '$': 'b1b1b1b0b', '/': 'b1b1b0b1b', '+': 'b1b0b1b1b', '%': 'b0b1b1b1b'
  };

  const code = value.toUpperCase();
  // Wrap in * for start/stop chars (essential for scanning)
  const encoded = `*${code}*`;

  let bars: { type: 'bar' | 'space', width: number }[] = [];

  // Add Quiet Zone (Start) - 10 units of white space
  bars.push({ type: 'space', width: 10 });

  for (let i = 0; i < encoded.length; i++) {
    const char = encoded[i];
    const pattern = CODE39_MAP[char] || CODE39_MAP[' ']; // Default to space if unknown
    
    // Parse pattern
    // pattern length is always 9 characters
    // Characters alternate bar, space, bar, space...
    // 1/B/W = wide, 0/b = narrow
    
    for (let j = 0; j < 9; j++) {
      const type = j % 2 === 0 ? 'bar' : 'space';
      const symbol = pattern[j];
      const isWide = symbol === 'B' || symbol === '1' || symbol === 'W';
      bars.push({
        type,
        width: isWide ? 2.5 : 1 // Standard ratio 2.5:1 (easier for scanners than 3:1 sometimes)
      });
    }
    
    // Inter-character gap (narrow space)
    if (i < encoded.length - 1) {
      bars.push({ type: 'space', width: 1 });
    }
  }

  // Add Quiet Zone (End)
  bars.push({ type: 'space', width: 10 });

  const totalWidth = bars.reduce((acc, bar) => acc + bar.width, 0);
  const height = 50;

  return (
    <div className="flex flex-col items-center bg-white p-3 border rounded-lg shadow-sm inline-block max-w-full overflow-hidden">
      <div className="overflow-x-auto w-full flex justify-center">
        <svg 
          width={totalWidth * 2} // Scale factor 2 for screen visibility
          height={height} 
          viewBox={`0 0 ${totalWidth} ${height}`}
          // preserveAspectRatio="xMidYMid meet" ensures it doesn't stretch distortedly
          preserveAspectRatio="xMidYMid meet"
          style={{ maxWidth: '100%', height: 'auto' }}
        >
          {(() => {
            let currentX = 0;
            return bars.map((bar, idx) => {
              const x = currentX;
              currentX += bar.width;
              if (bar.type === 'bar') {
                return (
                  <rect 
                    key={idx} 
                    x={x} 
                    y={0} 
                    width={bar.width} 
                    height={height} 
                    fill="black" 
                  />
                );
              }
              return null;
            });
          })()}
        </svg>
      </div>
      <div className="font-mono text-sm tracking-[0.2em] font-bold mt-2 text-slate-800">
        {encoded}
      </div>
    </div>
  );
};

export default BarcodeDisplay;