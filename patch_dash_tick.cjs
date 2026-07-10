const fs = require('fs');
let content = fs.readFileSync('src/components/Dashboard.tsx', 'utf8');

const target1 = `  const [alertVehicle, setAlertVehicle] = useState<Vehicle | null>(null);
  const prevStatuses = useRef<Record<string, string>>({});`;

const replacement1 = `  const [alertVehicle, setAlertVehicle] = useState<Vehicle | null>(null);
  const prevStatuses = useRef<Record<string, string>>({});
  const [, setTick] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setTick(t => t + 1);
    }, 30000);
    return () => clearInterval(timer);
  }, []);`;

if (content.includes(target1) && !content.includes('setTick')) {
  content = content.replace(target1, replacement1);
  fs.writeFileSync('src/components/Dashboard.tsx', content);
  console.log('Success Dash Tick');
} else {
  console.log('Target not found Dash Tick');
}
