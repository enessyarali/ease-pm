import { useSettingsStore, AIBackend } from '../store/useSettingsStore';
import { Select } from './ui/select';

const BackendSelector = () => {
  const { aiBackend, setBackend } = useSettingsStore();

  const options: { label: string; value: AIBackend }[] = [
    { label: 'OpenAI', value: 'openai' },
    { label: 'Gemini', value: 'gemini' },
    { label: 'Anthropic Claude', value: 'anthropic' },
    { label: 'fal.ai', value: 'fal' },
  ];

  return (
    <Select className="text-sm" value={aiBackend} onChange={(e) => setBackend(e.target.value as AIBackend)}>
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </Select>
  );
};

export default BackendSelector;
