'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from './Button';
import {
  PencilIcon,
  TrashIcon,
  XMarkIcon,
  CheckIcon,
  ArrowUturnLeftIcon,
} from '@heroicons/react/24/outline';

interface ImageEditorProps {
  initialImage: string;
  onSave: (editedImage: string) => void;
  onCancel: () => void;
}

interface TextObject {
  id: string;
  text: string;
  x: number;
  y: number;
  fontSize: number;
  color: string;
}

type Tool = 'draw' | 'text' | 'line' | 'rect' | 'circle' | 'eraser';

export function ImageEditor({ initialImage, onSave, onCancel }: ImageEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [tool, setTool] = useState<Tool>('draw');
  const [color, setColor] = useState('#000000');
  const [brushSize, setBrushSize] = useState(3);
  const [fontSize, setFontSize] = useState(16);
  const [texts, setTexts] = useState<TextObject[]>([]);
  const [selectedText, setSelectedText] = useState<string | null>(null);
  const [isDraggingText, setIsDraggingText] = useState(false);
  const isDrawingRef = useRef(false);
  const lastPosRef = useRef({ x: 0, y: 0 });
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const historyRef = useRef<ImageData[]>([]);

  // Inicializar canvas con HTML5
  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    if (!context) return;

    canvas.width = 800;
    canvas.height = 600;
    contextRef.current = context;

    // Cargar imagen inicial
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      imageRef.current = img;
      const scale = Math.min(
        canvas.width / img.width,
        canvas.height / img.height
      );
      const x = (canvas.width - img.width * scale) / 2;
      const y = (canvas.height - img.height * scale) / 2;
      
      context.fillStyle = '#ffffff';
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(img, x, y, img.width * scale, img.height * scale);
      
      // Guardar en historial
      historyRef.current = [context.getImageData(0, 0, canvas.width, canvas.height)];
    };
    img.src = initialImage;

    // Eventos del mouse
    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('mouseleave', handleMouseUp);

    return () => {
      canvas.removeEventListener('mousedown', handleMouseDown);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseup', handleMouseUp);
      canvas.removeEventListener('mouseleave', handleMouseUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialImage]);

  // Redibuja el canvas con textos cuando cambia
  useEffect(() => {
    if (!contextRef.current || !canvasRef.current) return;

    // Restaurar desde historial
    if (historyRef.current.length > 0) {
      const lastState = historyRef.current[historyRef.current.length - 1];
      contextRef.current.putImageData(lastState, 0, 0);
    }

    // Redibuja todos los textos
    texts.forEach((textObj) => {
      contextRef.current!.fillStyle = textObj.color;
      contextRef.current!.font = `${textObj.fontSize}px Arial`;
      contextRef.current!.fillText(textObj.text, textObj.x, textObj.y);
    });
  }, [texts]);

  const getMousePos = (event: MouseEvent) => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    const rect = canvasRef.current.getBoundingClientRect();
    
    // FIX CRÍTICO: Calcular el scaling entre el tamaño lógico y visual del canvas
    const scaleX = canvasRef.current.width / rect.width;
    const scaleY = canvasRef.current.height / rect.height;
    
    return {
      x: (event.clientX - rect.left) * scaleX,
      y: (event.clientY - rect.top) * scaleY,
    };
  };

  const isClickOnText = (pos: { x: number; y: number }) => {
    const ctx = contextRef.current;
    if (!ctx) return null;

    // Buscar si hizo click en algún texto
    for (let i = texts.length - 1; i >= 0; i--) {
      const textObj = texts[i];
      ctx.font = `${textObj.fontSize}px Arial`;
      const metrics = ctx.measureText(textObj.text);
      const textWidth = metrics.width;
      const textHeight = textObj.fontSize;

      if (
        pos.x >= textObj.x &&
        pos.x <= textObj.x + textWidth &&
        pos.y >= textObj.y - textHeight &&
        pos.y <= textObj.y
      ) {
        return textObj.id;
      }
    }
    return null;
  };

  const saveToHistory = () => {
    if (!canvasRef.current || !contextRef.current) return;
    const imageData = contextRef.current.getImageData(0, 0, canvasRef.current.width, canvasRef.current.height);
    historyRef.current.push(imageData);
  };

  const handleMouseDown = (event: MouseEvent) => {
    if (!contextRef.current || !canvasRef.current) return;

    const pos = getMousePos(event);

    if (tool === 'text') {
      // Permitir seleccionar y mover texto
      const clickedTextId = isClickOnText(pos);
      if (clickedTextId) {
        setSelectedText(clickedTextId);
        setIsDraggingText(true);
        lastPosRef.current = pos;
      }
    } else {
      // Dibujar
      isDrawingRef.current = true;
      lastPosRef.current = pos;
      saveToHistory();
    }
  };

  const handleMouseMove = (event: MouseEvent) => {
    if (!contextRef.current || !canvasRef.current) return;

    const pos = getMousePos(event);
    const context = contextRef.current;

    if (tool === 'text' && isDraggingText && selectedText) {
      // Mover texto
      const dx = pos.x - lastPosRef.current.x;
      const dy = pos.y - lastPosRef.current.y;

      setTexts((prevTexts) =>
        prevTexts.map((textObj) =>
          textObj.id === selectedText
            ? { ...textObj, x: textObj.x + dx, y: textObj.y + dy }
            : textObj
        )
      );

      lastPosRef.current = pos;
    } else if (!isDrawingRef.current || tool === 'text') {
      return;
    } else if (tool === 'draw') {
      // FIX: Color se actualiza dinámicamente
      context.strokeStyle = color;
      context.lineWidth = brushSize;
      context.lineCap = 'round';
      context.lineJoin = 'round';
      context.beginPath();
      context.moveTo(lastPosRef.current.x, lastPosRef.current.y);
      context.lineTo(pos.x, pos.y);
      context.stroke();
      lastPosRef.current = pos;
    } else if (tool === 'eraser') {
      context.clearRect(pos.x - brushSize / 2, pos.y - brushSize / 2, brushSize, brushSize);
      lastPosRef.current = pos;
    }
  };

  const handleMouseUp = () => {
    if (tool === 'text' && isDraggingText) {
      setIsDraggingText(false);
    } else {
      isDrawingRef.current = false;
    }
  };

  const handleAddText = () => {
    const textContent = prompt('Ingresa el texto:');
    if (!textContent) return;

    saveToHistory();

    const newText: TextObject = {
      id: `text-${Date.now()}`,
      text: textContent,
      x: 50,
      y: 50,
      fontSize: fontSize,
      color: color,
    };

    setTexts([...texts, newText]);
    setTool('text'); // Cambiar a herramienta de texto para poder mover
  };

  const handleClear = () => {
    if (!canvasRef.current || !contextRef.current) return;
    
    const context = contextRef.current;
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    
    if (imageRef.current) {
      const scale = Math.min(
        canvasRef.current.width / imageRef.current.width,
        canvasRef.current.height / imageRef.current.height
      );
      const x = (canvasRef.current.width - imageRef.current.width * scale) / 2;
      const y = (canvasRef.current.height - imageRef.current.height * scale) / 2;
      context.drawImage(imageRef.current, x, y, imageRef.current.width * scale, imageRef.current.height * scale);
    }
    
    setTexts([]);
    setSelectedText(null);
    historyRef.current = [context.getImageData(0, 0, canvasRef.current.width, canvasRef.current.height)];
  };

  const handleUndo = () => {
    if (historyRef.current.length <= 1 || !contextRef.current || !canvasRef.current) return;
    
    historyRef.current.pop();
    const previousState = historyRef.current[historyRef.current.length - 1];
    contextRef.current.putImageData(previousState, 0, 0);
    setTexts([]);
    setSelectedText(null);
  };

  const handleSave = () => {
    if (!canvasRef.current) return;
    const editedImage = canvasRef.current.toDataURL('image/png');
    onSave(editedImage);
  };

  return (
    <div className="flex flex-col gap-4 w-full max-w-4xl mx-auto">
      {/* Canvas */}
      <div className="border-2 border-gray-300 rounded-lg overflow-hidden bg-white">
        <canvas
          ref={canvasRef}
          className="w-full h-auto display-block cursor-crosshair"
          style={{ maxWidth: '100%', height: 'auto', display: 'block' }}
        />
      </div>

      {/* Toolbar */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {/* Herramientas principales */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold text-gray-700">Herramientas</label>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setTool('draw')}
              className={`p-2 rounded-lg border-2 transition-all ${
                tool === 'draw'
                  ? 'bg-blue-600 text-white border-blue-700'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
              title="Dibujar"
            >
              <PencilIcon className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={handleAddText}
              className={`p-2 rounded-lg border-2 transition-all ${
                tool === 'text'
                  ? 'bg-blue-600 text-white border-blue-700'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
              title="Agregar Texto"
            >
              <span className="text-lg font-bold">A</span>
            </button>

            <button
              type="button"
              onClick={() => setTool('eraser')}
              className={`p-2 rounded-lg border-2 transition-all ${
                tool === 'eraser'
                  ? 'bg-blue-600 text-white border-blue-700'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
              title="Borrador"
            >
              <span className="text-lg">✕</span>
            </button>
          </div>
        </div>

        {/* Color */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold text-gray-700">Color</label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="w-12 h-10 rounded-lg cursor-pointer border-2 border-gray-300"
              title="Color del trazo"
            />
            <span className="text-xs text-gray-600 font-mono">{color}</span>
          </div>
        </div>

        {/* Tamaño de pincel */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold text-gray-700">Grosor</label>
          <input
            type="range"
            min="1"
            max="20"
            value={brushSize}
            onChange={(e) => setBrushSize(parseInt(e.target.value))}
            className="w-full rounded-lg"
            title="Tamaño del pincel"
          />
          <span className="text-xs text-gray-600 text-center">{brushSize}px</span>
        </div>

        {/* Tamaño de fuente */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold text-gray-700">Fuente</label>
          <input
            type="range"
            min="8"
            max="48"
            value={fontSize}
            onChange={(e) => setFontSize(parseInt(e.target.value))}
            className="w-full rounded-lg"
            title="Tamaño de fuente"
          />
          <span className="text-xs text-gray-600 text-center">{fontSize}px</span>
        </div>
      </div>

      {/* Instrucciones */}
      {tool === 'text' && texts.length > 0 && (
        <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded-lg">
          💡 Haz clic en un texto para seleccionarlo y arrastrarlo a otra posición
        </div>
      )}

      {/* Botones de acción */}
      <div className="flex gap-2 flex-wrap justify-end">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          icon={<ArrowUturnLeftIcon className="w-4 h-4" />}
          onClick={handleUndo}
        >
          Deshacer
        </Button>

        <Button
          type="button"
          variant="secondary"
          size="sm"
          icon={<TrashIcon className="w-4 h-4" />}
          onClick={handleClear}
        >
          Limpiar
        </Button>

        <Button
          type="button"
          variant="secondary"
          size="sm"
          icon={<XMarkIcon className="w-4 h-4" />}
          onClick={onCancel}
        >
          Cancelar
        </Button>

        <Button
          type="button"
          variant="success"
          size="sm"
          icon={<CheckIcon className="w-4 h-4" />}
          onClick={handleSave}
        >
          Guardar Cambios
        </Button>
      </div>
    </div>
  );
}
