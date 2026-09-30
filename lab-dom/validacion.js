document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('inscripcion');
  const confirmacion = document.getElementById('confirmacion');
  const campoSede = document.getElementById('campo-sede');
  const meter = document.getElementById('clave-meter');
  const meterLbl = document.getElementById('clave-meter-lbl');
  const comentariosInput = document.getElementById('comentarios');
  const comentariosContador = document.getElementById('comentarios-contador');
 
  const tocados = new Set();

  const reglas = {
    nombre: v => {
      const trimmed = v.trim();
      if (!trimmed) return 'Escribe tu nombre y apellido.';
      if (trimmed.length < 5 || trimmed.length > 60) return 'El nombre debe tener entre 5 y 60 caracteres.';
      const palabras = trimmed.split(/\s+/).filter(Boolean);
      if (palabras.length < 2) return 'Escribe tu nombre y apellido.';
      const soloLetras = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/;
      if (!soloLetras.test(trimmed)) return 'Solo se permiten letras en el nombre.';
      return true;
    },

    cedula: v => /^([1-9]|1[0-3]|PE|E|N)-\d{1,4}-\d{1,6}$/i.test(v.trim()) || 'Usa el formato 8-123-4567.',

    correo: v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) || 'Usa un correo como nombre@dominio.com.',

    celular: v => /^6\d{3}-?\d{4}$/.test(v.trim()) || 'El celular debe tener 8 dígitos y empezar con 6.',

    fechaNacimiento: v => {
      if (!v) return 'Selecciona tu fecha de nacimiento.';
      const fechaNac = new Date(v);
      const hoy = new Date();
      if (fechaNac > hoy) return 'La fecha de nacimiento no puede ser futura.';
       
      const limite = new Date();
      limite.setFullYear(limite.getFullYear() - 16);
      if (fechaNac > limite) return 'Debes tener al menos 16 años.';
      return true;
    },

    curso: v => Boolean(v) || 'Elige un curso.',

    modalidad: () => {
      const seleccionada = form.querySelector('input[name="modalidad"]:checked');
      return Boolean(seleccionada) || 'Elige una modalidad.';
    },

    sede: v => {
      const modalidad = form.querySelector('input[name="modalidad"]:checked')?.value;
      if (modalidad === 'presencial') {
        return Boolean(v) || 'Elige una sede.';
      }
      return true;
    },

    clave: v => {
      const falta = [];
      if (v.length < 8) falta.push('8 caracteres');
      if (!/[A-Z]/.test(v)) falta.push('una mayúscula');
      if (!/[a-z]/.test(v)) falta.push('una minúscula');
      if (!/\d/.test(v)) falta.push('un número');
      if (!/[^A-Za-z0-9]/.test(v)) falta.push('un símbolo');
      return falta.length === 0 || `Te falta: ${falta.join(', ')}.`;
    },

    clave2: v => (v.length > 0 && v === form.clave.value) || 'Las contraseñas no coinciden.',

    comentarios: v => v.length <= 200 || 'Máximo 200 caracteres.',

    terminos: () => form.terminos.checked || 'Debes aceptar los términos.'
  };
 
  function validarCampo(input) {
    const nombreCampo = input.name || input.id;
    if (!reglas[nombreCampo]) return true;

    const valor = input.type === 'checkbox' ? input.checked : input.value;
    const resultado = reglas[nombreCampo](valor);
    const valido = resultado === true;

    let errorEl = document.getElementById(`${nombreCampo}-error`);
    if (input.type === 'radio') {
      errorEl = document.getElementById('modalidad-error');
    }

    if (errorEl) {
      errorEl.textContent = valido ? '' : resultado;
    }

    if (input.type !== 'radio') {
      input.setAttribute('aria-invalid', String(!valido));
    }

    return valido;
  }
 
  function calcularFuerza(v) {
    let p = 0;
    if (v.length >= 8) p++;
    if (v.length >= 12) p++;
    if (/[A-Z]/.test(v) && /[a-z]/.test(v)) p++;
    if (/\d/.test(v)) p++;
    if (/[^A-Za-z0-9]/.test(v)) p++;

    const niveles = [
      ['—', '0%', 'var(--err)'],
      ['Muy débil', '20%', 'var(--err)'],
      ['Débil', '40%', 'var(--err)'],
      ['Aceptable', '60%', 'var(--warn)'],
      ['Buena', '80%', 'var(--ok)'],
      ['Fuerte', '100%', 'var(--ok)']
    ];

    const [txt, ancho, color] = v ? niveles[p] : niveles[0];
    meter.style.width = ancho;
    meter.style.background = color;
    meterLbl.textContent = `Fuerza: ${txt}`;
  }
 
  function actualizarContadorComentarios(texto) {
    const len = texto.length;
    comentariosContador.textContent = `${len}/200`;
    if (len > 180) {
      comentariosContador.classList.add('alerta');
    } else {
      comentariosContador.classList.remove('alerta');
    }
  }
 
  form.addEventListener('blur', e => {
    const target = e.target;
    if (!target.name && !target.id) return;
    const name = target.name || target.id;
    if (!reglas[name]) return;

    tocados.add(name);
    validarCampo(target);
  }, true);
 
  form.addEventListener('input', e => {
    const target = e.target;
    const name = target.name || target.id;

    if (name === 'clave') {
      calcularFuerza(target.value);
      if (tocados.has('clave2')) {
        validarCampo(form.clave2);
      }
    }

    if (name === 'comentarios') {
      actualizarContadorComentarios(target.value);
    }

    if (tocados.has(name)) {
      validarCampo(target);
    }
  });
 
  form.addEventListener('change', e => {
    if (e.target.name === 'modalidad') {
      const esPresencial = e.target.value === 'presencial';
      if (esPresencial) {
        campoSede.hidden = false;
      } else {
        campoSede.hidden = true;
        form.sede.value = '';
        document.getElementById('sede-error').textContent = '';
        form.sede.removeAttribute('aria-invalid');
      }
      tocados.add('modalidad');
      validarCampo(e.target);
    }

    if (e.target.name === 'sede' || e.target.name === 'curso' || e.target.id === 'terminos') {
      tocados.add(e.target.name || e.target.id);
      validarCampo(e.target);
    }
  });
 
  form.addEventListener('submit', e => {
    e.preventDefault();

    const camposAValidar = [
      form.nombre,
      form.cedula,
      form.correo,
      form.celular,
      form.fechaNacimiento,
      form.curso,
      form.querySelector('input[name="modalidad"]'),
      form.clave,
      form.clave2,
      comentariosInput,
      form.terminos
    ];

    if (form.querySelector('input[name="modalidad"]:checked')?.value === 'presencial') {
      camposAValidar.push(form.sede);
    }
 
    camposAValidar.forEach(input => {
      if (input) tocados.add(input.name || input.id);
    });
 
    const invalidos = camposAValidar.filter(input => input && !validarCampo(input));

    if (invalidos.length > 0) {
      confirmacion.textContent = '';
      invalidos[0].focus();
      return;
    }
 
    mostrarTarjetaConfirmacion(new FormData(form));
 
    form.reset();
    tocados.clear();
    calcularFuerza('');
    campoSede.hidden = true;
    actualizarContadorComentarios('');
    camposAValidar.forEach(el => el && el.removeAttribute('aria-invalid'));
  });
 
  function mostrarTarjetaConfirmacion(formData) {
    confirmacion.textContent = '';

    const panel = document.createElement('div');
    panel.className = 'ok-panel';

    const h3 = document.createElement('h3');
    h3.textContent = '¡Inscripción confirmada!';

    const dl = document.createElement('dl');

    const listaDatos = [
      ['Nombre', formData.get('nombre')],
      ['Cédula', formData.get('cedula')],
      ['Correo', formData.get('correo')],
      ['Celular', formData.get('celular')],
      ['Fecha de nacimiento', formData.get('fechaNacimiento')],
      ['Curso', formData.get('curso')],
      ['Modalidad', formData.get('modalidad')]
    ];

    if (formData.get('modalidad') === 'presencial') {
      listaDatos.push(['Sede', formData.get('sede')]);
    }

    const comentarios = formData.get('comentarios');
    if (comentarios && comentarios.trim() !== '') {
      listaDatos.push(['Comentarios', comentarios]);
    }

    listaDatos.forEach(([label, valor]) => {
      const dt = document.createElement('dt');
      dt.textContent = label;
      const dd = document.createElement('dd');
      dd.textContent = valor;
      dl.append(dt, dd);
    });

    panel.append(h3, dl);
    confirmacion.append(panel);
  }
});