import { Buffer } from 'buffer';
import process from 'process';

if (typeof window !== "undefined") {
    window.global = window.global ?? window;
    window.Buffer = window.Buffer ?? Buffer;
    window.process = window.process ?? process;
}
