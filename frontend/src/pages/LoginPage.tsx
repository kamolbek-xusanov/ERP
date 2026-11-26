import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ApiError } from '../api/client';
import { HOME, useAuth } from '../auth/AuthContext';
import { Button, Field, FormError, Input } from '../components/ui';

export default function LoginPage() {
  const { login } = useAuth(); const navigate = useNavigate(); const [error,setError]=useState<ApiError|null>(null); const [busy,setBusy]=useState(false);
  const submit=async(e:FormEvent<HTMLFormElement>)=>{e.preventDefault();const form=new FormData(e.currentTarget);setBusy(true);setError(null);try{const user=await login(String(form.get('login')),String(form.get('password')));navigate(HOME[user.role],{replace:true});}catch(err){setError(err as ApiError)}finally{setBusy(false)}};
  return <div className="login"><form className="card login-card" onSubmit={submit}>
    <div className="login-brand"><div className="brand-mark"><span>E</span></div><div><div className="brand-name">Edu<span>via</span></div><div className="brand-sub">EDUCATION PLATFORM</div></div></div>
    <div><h1>Xush kelibsiz</h1><div className="login-title">O‘qishni davom ettirish uchun hisobingizga kiring.</div></div>
    <Field label="Login" name="login" error={error}><Input name="login" autoComplete="username" autoFocus required placeholder="Loginni kiriting" /></Field>
    <Field label="Parol" name="password" error={error}><Input name="password" type="password" autoComplete="current-password" required placeholder="Parolingizni kiriting" /></Field>
    <FormError error={error}/><Button type="submit" loading={busy}>Kirish →</Button>
    <div className="muted" style={{textAlign:'center',fontSize:10}}>Eduvia · Learning management platform</div>
  </form></div>;
}
