/**
 MOS6502 microprocessor emulation
 By Chester Abrahams
 **/

// Registers
let A=0,                              // Main
    X=0,Y=0,SP=0,                     // Index
    PC=0,                             // Program counter
    S={C:0,Z:0,I:0,D:1,B:1,V:0,N:0};  // Status flags

// Stack
// 128 16B array for efficiency. Originally it's 1 byte
const stack = new Uint16Array(0x80);

// Memory (64K)
const RAM = new Uint8Array(0xFFFF);

let ROM;

// Built-in read-only memory
// My program, set random pixel addr with random byte & repeat Todo: LATER:
ROM = [
  //Address  Hexdump   Dissassembly
  //-------------------------------
  /*$0600*/    0x20, 0x12, 0x06,  //JSR $0612
  /*$0603*/    0x20, 0x1e, 0x06,  //JSR $061e
  /*$0606*/    0x20, 0x2a, 0x06,  //JSR $062a
  /*$0609*/    0x20, 0x36, 0x06,  //JSR $0636
  /*$060c*/    0x20, 0x42, 0x06,  //JSR $0642
  /*$060f*/    0x4c, 0x00, 0x06,  //JMP $0600
  /*$0612*/    0xa2, 0x05,        //LDX #$05
  /*$0614*/    0x86, 0x00,        //STX $00
  /*$0616*/    0xa6, 0xfe,        //LDX $fe
  /*$0618*/    0xa5, 0xfe,        //LDA $fe
  /*$061a*/    0x9d, 0x00, 0x02,  //STA $0200,X
  /*$061d*/    0x60,              //RTS
  /*$061e*/    0xa2, 0x05,        //LDX #$05
  /*$0620*/    0x86, 0x00,        //STX $00
  /*$0622*/    0xa6, 0xfe,        //LDX $fe
  /*$0624*/    0xa5, 0xfe,        //LDA $fe
  /*$0626*/    0x9d, 0x00, 0x03,  //STA $0300,X
  /*$0629*/    0x60,              //RTS
  /*$062a*/    0xa2, 0x05,        //LDX #$05
  /*$062c*/    0x86, 0x00,        //STX $00
  /*$062e*/    0xa6, 0xfe,        //LDX $fe
  /*$0630*/    0xa5, 0xfe,        //LDA $fe
  /*$0632*/    0x9d, 0x00, 0x04,  //STA $0400,X
  /*$0635*/    0x60,              //RTS
  /*$0636*/    0xa2, 0x05,        //LDX #$05
  /*$0638*/    0x86, 0x00,        //STX $00
  /*$063a*/    0xa6, 0xfe,        //LDX $fe
  /*$063c*/    0xa5, 0xfe,        //LDA $fe
  /*$063e*/    0x9d, 0x00, 0x05,  //STA $0500,X
  /*$0641*/    0x60,              //RTS
  /*$0642*/    0xa2, 0x05,        //LDX #$05
  /*$0644*/    0x86, 0x00,        //STX $00
  /*$0646*/    0xa6, 0xfe,        //LDX $fe
  /*$0648*/    0xa5, 0xfe,        //LDA $fe
  /*$064a*/    0x9d, 0x00, 0x05,  //STA $0500,X
  /*$064d*/    0x60,              //RTS
];

// Load rom data into RAM
for ( let i=0; i < Math.min(ROM.length, 0xFFFF-0x0600-1); i++ )
  RAM[0x0600+i] = ROM[i];

// Program starts at 0x0600
PC = 0x0600;

/**
 * Opcode table
 */
const exec = (opcode)=>
{
  const q = (table)=> { return base256_decode(table)[opcode] == 1 }

  // Set temp pointer
  if(q(" W60 U6W U606U60FaN4FYE2F2F2F2F2     2F2F22")) T=A;
  if(q("                      60 U W U60 0    0    ")) T=X;
  if(q("                      W 0 060 U6 6         ")) T=Y;
  if(q("                       6                   ")) T=T;

  if(q("     6                                     ")) SP+=1;
  if(q("                U                          ")) PC=stack[SP];
  if(q("     6                                     ")) stack[SP]=PC;
  if(q("                U                          ")) SP-=1;
  if(q("     6      0                              ")) PC=H2D(D2H(RAM[PC+2])+D2H(RAM[PC+1]));
  if(q("                  U                        ")) PC=H2D(MMS(RAM[RAM[PC+1]],RAM[RAM[PC+1]+1]));

  if(q("                                 6    0    ")) T+=1;
  if(q("                      0          0         ")) T-=1;
  if(q("                            6              ")) X=A;
  if(q("                       U                   ")) A=X;
  if(q("                            U              ")) Y=A;
  if(q("                         6                 ")) A=Y;

  if(q("                          0UE              ")) T = RAM[PC+1];
  if(q("                           C               ")) T = RAM[RAM[PC+1]];
  if(q("                              k            ")) T = RAM[(RAM[PC+1]+X) % 0x100];
  if(q("                              6            ")) T = RAM[(RAM[PC+1]+Y) % 0x100];
  if(q("                            1U             ")) T = RAM[H2D(D2H(RAM[PC+2])+D2H(RAM[PC+1]))];
  if(q("                               A           ")) T = RAM[(H2D(D2H(RAM[PC+2])+D2H(RAM[PC+1]))+X)];
  if(q("                              !0           ")) T = RAM[(H2D(D2H(RAM[PC+2])+D2H(RAM[PC+1]))+Y)];
  if(q("                          !                ")) T = RAM[H2D(MMS(RAM[RAM[PC+1]+X],RAM[RAM[PC+1]+X+1]))];
  if(q("                             2             ")) T = RAM[H2D(MMS(RAM[RAM[PC+1]],RAM[RAM[PC+1]+1]))+Y];

  if(q("                      s                    ")) RAM[RAM[PC+1]]                                     = T;
  if(q("                        1                  ")) RAM[(RAM[PC+1]+X) % 0x100]                         = T;
  if(q("                       2                   ")) RAM[H2D(D2H(RAM[PC+2])+D2H(RAM[PC+1]))]            = T;
  if(q("                          E                ")) RAM[(H2D(D2H(RAM[PC+2])+D2H(RAM[PC+1]))+X)]        = T;
  if(q("                         2                 ")) RAM[(H2D(D2H(RAM[PC+2])+D2H(RAM[PC+1]))+Y)]        = T;
  if(q("                     2                     ")) RAM[H2D(MMS(RAM[RAM[PC+1]+X],RAM[RAM[PC+1]+X+1]))] = T;
  if(q("                        E                  ")) RAM[H2D(MMS(RAM[RAM[PC+1]],RAM[RAM[PC+1]+1]))+Y]   = T;

  // Unary
  if(q("                      0          8    0    ")) T<0&&(T=(0x100-Math.abs(T))%0x100);

  // Arthimetic
  if(q("                F2F2F                      ")) A=(A+M+S.C)%0x100;
  if(q("                                     2F2F22")) A=(A-(M+S.C))%0x100;
  if(q("                 2              U    6!    ")) M = RAM[PC+1];
  if(q("                !               0     k    ")) M = RAM[RAM[PC+1]];
  if(q("                   2                    !  ")) M = RAM[(RAM[PC+1]+X) % 0x100];
  if(q("                  E               U    A   ")) M = RAM[H2D(D2H(RAM[PC+2])+D2H(RAM[PC+1]))];
  if(q("                    !                     2")) M = RAM[(H2D(D2H(RAM[PC+2])+D2H(RAM[PC+1]))+X)];
  if(q("                    E                    2 ")) M = RAM[(H2D(D2H(RAM[PC+2])+D2H(RAM[PC+1]))+Y)];
  if(q("                E                    2     ")) M = RAM[H2D(MMS(RAM[RAM[PC+1]+X],RAM[RAM[PC+1]+X+1]))];
  if(q("                  !                     E  ")) M = RAM[H2D(MMS(RAM[RAM[PC+1]],RAM[RAM[PC+1]+1]))+Y];

  if(q("                                 2         ")) R = A-RAM[PC+1];
  if(q("                                !          ")) R = A-RAM[RAM[PC+1]];
  if(q("                                   2       ")) R = A-RAM[(RAM[PC+1]+X) % 0x100];
  if(q("                                  E        ")) R = A-RAM[H2D(D2H(RAM[PC+2])+D2H(RAM[PC+1]))];
  if(q("                                    !      ")) R = A-RAM[(H2D(D2H(RAM[PC+2])+D2H(RAM[PC+1]))+X)];
  if(q("                                    E      ")) R = A-RAM[(H2D(D2H(RAM[PC+2])+D2H(RAM[PC+1]))+Y)];
  if(q("                                E          ")) R = A-RAM[H2D(MMS(RAM[RAM[PC+1]+X],RAM[RAM[PC+1]+X+1]))] ;
  if(q("                                  !        ")) R = A-RAM[H2D(MMS(RAM[RAM[PC+1]],RAM[RAM[PC+1]+1]))+Y];
  if(q("                                W U  6U6   ")) R=X-M;

  if(q("      !                                    ")) A &= RAM[PC+1];
  if(q("      E                                    ")) A &= RAM[RAM[PC+1]];
  if(q("        !                                  ")) A &= RAM[(RAM[PC+1]+X) % 0x100];
  if(q("       2                                   ")) A &= RAM[H2D(D2H(RAM[PC+2])+D2H(RAM[PC+1]))];
  if(q("          E                                ")) A &= RAM[(H2D(D2H(RAM[PC+2])+D2H(RAM[PC+1]))+X)];
  if(q("         2                                 ")) A &= RAM[(H2D(D2H(RAM[PC+2])+D2H(RAM[PC+1]))+Y)];
  if(q("     2                                     ")) A &= RAM[H2D(MMS(RAM[RAM[PC+1]+X],RAM[RAM[PC+1]+X+1]))] ;
  if(q("        E                                  ")) A &= RAM[H2D(MMS(RAM[RAM[PC+1]],RAM[RAM[PC+1]+1]))+Y];
  if(q("            E                              ")) A ^= RAM[PC+1];
  if(q("           2                               ")) A ^= RAM[RAM[PC+1]];
  if(q("              E                            ")) A ^= RAM[(RAM[PC+1]+X) % 0x100];
  if(q("            !                              ")) A ^= RAM[H2D(D2H(RAM[PC+2])+D2H(RAM[PC+1]))];
  if(q("               2                           ")) A ^= RAM[(H2D(D2H(RAM[PC+2])+D2H(RAM[PC+1]))+X)];
  if(q("              !                            ")) A ^= RAM[(H2D(D2H(RAM[PC+2])+D2H(RAM[PC+1]))+Y)];
  if(q("          !                                ")) A ^= RAM[H2D(MMS(RAM[RAM[PC+1]+X],RAM[RAM[PC+1]+X+1]))] ;
  if(q("             2                             ")) A ^= RAM[H2D(MMS(RAM[RAM[PC+1]],RAM[RAM[PC+1]+1]))+Y];
  if(q(" 2                                         ")) A |= RAM[PC+1];
  if(q("!                                          ")) A |= RAM[RAM[PC+1]];
  if(q("  E                                        ")) A |= RAM[H2D(D2H(RAM[PC+2])+D2H(RAM[PC+1]))];
  if(q("   2                                       ")) A |= RAM[(RAM[PC+1]+X) % 0x100];
  if(q("    !                                      ")) A |= RAM[(H2D(D2H(RAM[PC+2])+D2H(RAM[PC+1]))+X)];
  if(q("    E                                      ")) A |= RAM[(H2D(D2H(RAM[PC+2])+D2H(RAM[PC+1]))+Y)];
  if(q("E                                          ")) A |= RAM[H2D(MMS(RAM[RAM[PC+1]+X],RAM[RAM[PC+1]+X+1]))] ;
  if(q("  !                                        ")) A |= RAM[H2D(MMS(RAM[RAM[PC+1]],RAM[RAM[PC+1]+1]))+Y];

  if(q("      U                                    ")) T=V=RAM[RAM[PC+1]] & A;
  if(q("       6                                   ")) T=V=RAM[H2D(D2H(RAM[PC+2])+D2H(RAM[PC+1]))] & A;

  if(q(" 0     U                                   ")) A<<=1;
  if(q(" U    6                                    ")) R=RAM[RAM[PC+1]]<<=1;
  if(q("   0     U                                 ")) R=RAM[(RAM[PC+1]+X) % 0x100]<<=1;
  if(q("  6    0                                   ")) R=RAM[H2D(D2H(RAM[PC+2])+D2H(RAM[PC+1]))] <<=1;
  if(q("     U    6                                ")) R=RAM[(H2D(D2H(RAM[PC+2])+D2H(RAM[PC+1]))+X)] <<=1;
  if(q("                 0                         ")) A>>=1;
  if(q("                 U                         ")) R=RAM[RAM[PC+1]]>>=1;
  if(q("                   0                       ")) R=RAM[(RAM[PC+1]+X) % 0x100]>>=1;
  if(q("                  6                        ")) R=RAM[H2D(D2H(RAM[PC+2])+D2H(RAM[PC+1]))] >>=1;
  if(q("                     U                     ")) R=RAM[(H2D(D2H(RAM[PC+2])+D2H(RAM[PC+1]))+X)] >>=1;
  if(q("            6                              ")) A>>>=1;
  if(q("           0                               ")) R=RAM[RAM[PC+1]] >>>=1;
  if(q("              6                            ")) R=RAM[(RAM[PC+1]+X) % 0x100] >>>=1;
  if(q("             U                             ")) R=RAM[H2D(D2H(RAM[PC+2])+D2H(RAM[PC+1]))]>>>=1;
  if(q("               0                           ")) R=RAM[(H2D(D2H(RAM[PC+2])+D2H(RAM[PC+1]))+X)]>>>=1;
  if(q("                                      6    ")) R=RAM[RAM[PC+1]] +=1;
  if(q("                                         U ")) R=RAM[(RAM[PC+1]+X) % 0x100] +=1;
  if(q("                                       0   ")) R=RAM[H2D(D2H(RAM[PC+2])+D2H(RAM[PC+1]))]+=1;
  if(q("                                          0")) R=RAM[(H2D(D2H(RAM[PC+2])+D2H(RAM[PC+1]))+X)]+=1;
  if(q("                                 U         ")) R=RAM[RAM[PC+1]] -=1;
  if(q("                                   0       ")) R=RAM[(RAM[PC+1]+X) % 0x100] -=1;
  if(q("                                  6        ")) R=RAM[H2D(D2H(RAM[PC+2])+D2H(RAM[PC+1]))]-=1;
  if(q("                                     U     ")) R=RAM[(H2D(D2H(RAM[PC+2])+D2H(RAM[PC+1]))+X)]-=1;

  // Stack
  if(q("            U                              ")) stack[SP+=1]=A;
  if(q("                 6                         ")) A=stack[SP-=1];
  if(q("                         0                 ")) stack[SP-1]=X;
  if(q("                               U           ")) X=stack[SP-1];
  if(q(" 6                                         ")) stack[SP-1]=SF();
  if(q("      0                                    ")) { C=0; for ( let i in S ) { S[i] = GB(C,stack[SP-1]); C++; } PC-=1 };
  if(q("                                           ")) PCV=RAM[PC+1];

  // Status
  if(q("  0          6          U         0        ")) S[T]==0 && (PC+= PCV<129?PCV:-(0x100-PCV));
  if(q("        U         0          6          U  ")) S[T]>0  && (PC+= PCV<129?PCV:-(0x100-PCV));
  if(q("             6    0           0            ")) T='V';
  if(q("  0     U                                  ")) T='N';
  if(q("             6    0                        ")) T='V';
  if(q("    U    6              U    6             ")) T='C';
  if(q("                                  0     U  ")) T='Z';
  if(q("                                    U    6 ")) T='D';
  if(q("              0     U                      ")) T='I';
  if(q("    U         0               0     U      ")) S[T]=0;
  if(q("         6          U                    6 ")) S[T]=1;

  // System
  if(q("                U                          ")) SP=Math.max(SP,0);
  if(q("U                                          ")) BRK();
  if(q("U                                          ")) PC-=1;
  if(q("U                                          ")) S.B=1;

  // Status flags
  if(q("                                 U60 U60 U0")) SF({Z:!R,N:GB(7,R)});
  if(q(" W60 U6W U606U60 W60 U                     ")) SF({C:GB(7,T),Z:!A,N:GB(7,A)});
  if(q("      U6                                   ")) SF({Z:!A,V:GB(6,V),V:GB(6,V),N:GB(7,V)});
  if(q("                                     6U6   ")) SF({C:X>=M,Z:X==M,N:GB(7,R)});
  if(q("                                W U        ")) SF({C:Y>=M,Z:Y==M,N:GB(7,R)});
  if(q("                                F2F2F      ")) SF({C:A>=R,Z:A==R,N:GB(7,R)});
  if(q("                F2F2F                2F2F22")) SF({C:T+M>0xFF,Z:!A,N:GB(7,A)});
  if(q("                           W6U6W 0    0    ")) SF({Z:!X,N:GB(7,X)});
  if(q("F2F2F2F2F2F2F2F2 6     U 6!2F2F2           ")) SF({Z:!A,N:GB(7,A)});
  if(q("                      0   06W U6 6         ")) SF({Z:!Y,N:GB(7,Y)});

  // Program counter advancements
  if(q("  M FU C 2M !U!4U M FU C 2E 1U!C  s FU C 24")) PC+=1;
  if(q("     6      0     U                        ")) PC-=2;
  if(q("U80 U  UU60 c60  80 U 0UU8  c60U 80 U 0UU6 ")) PC-=1;

  // Reset temp pointer
  if(q(" W60 U6W U606U60FaN4FYE2F2F2F2F2     2F2F22")) A=T;
  if(q("                      60 U W U60 0    0    ")) X=T;
  if(q("                      W 0 060 U6 6         ")) Y=T;
  if(q("                       6                   ")) T=T;
}

/**
 * Instruction set
 *
 * Addressing modes:
 *  short,    mode,      len
 *   ACC    Accumulator   1 // PC-1
 *   IMM    Immediate     2
 *   ZP     Zero Page     2
 *   ZPX    Zero Page,X   2
 *   ZPY    Zero Page,Y   2
 *   ABS    Absolute      3 // PC+1
 *   ABSX   Absolute,X    3 // PC+1
 *   ABSY   Absolute,Y    3 // PC+1
 *   IND    Indirect      3 // PC+1
 *   INDX   Indirect,X    2
 *   INDY   Indirect,Y    2
 *
 * Note:
 *  // S[*(operator)] = affected flags
 *  // PC-=1 means PC advances by 1B only
 *  // Current stack pointer is SP-1
 *  // Bit is to assign bool with remainder 0 or 1
 *  // S[N] (negative) set means 7th bit of A is true
 */

const ins =
{
  /*   Mode     Opcode     Code                                               Affecting flags             Program counter */

  // LoaD
    // LDA, S[S=A,Z=A[7]]
      /*IMM*/   0xa9 :()=> (A = RAM[PC+1])                                    & (S.Z=!A) & (S.N=GB(7,A)),
      /*ZP*/    0xa5 :()=> (A = RAM[RAM[PC+1]])                               & (S.Z=!A) & (S.N=GB(7,A)),
      /*ZPX*/   0xb5 :()=> (A = RAM[(RAM[PC+1]+D2H(X)) % 0xFF])               & (S.Z=!A) & (S.N=GB(7,A)),
      /*ABS*/   0xad :()=> (A = RAM[H2D(D2H(RAM[PC+2])+D2H(RAM[PC+1]))])      & (S.Z=!A) & (S.N=GB(7,A))  & (PC+=1),
      /*ABSX*/  0xbd :()=> (A = RAM[(H2D(D2H(RAM[PC+2])+D2H(RAM[PC+1]))+X)])  & (S.Z=!A) & (S.N=GB(7,A))  & (PC+=1),
      /*ABSY*/  0xb9 :()=> (A = RAM[(H2D(D2H(RAM[PC+2])+D2H(RAM[PC+1]))+Y)])  & (S.Z=!A) & (S.N=GB(7,A))  & (PC+=1),
      /*INDX*/  0xa1 :()=> (A = RAM[H2D(D2H(X)+D2H(RAM[PC+1]))])              & (S.Z=!A) & (S.N=GB(7,A)),
      /*INDY*/  0xb1 :()=> (A = RAM[H2D(D2H(RAM[PC+1])+D2H(RAM[PC+1]+Y))+Y])  & (S.Z=!A) & (S.N=GB(7,A)),
    // LDX, S[S,Z]
      /*IMM*/   0xA2 :()=> (X = RAM[PC+1])                                    & (S.Z=!X) & (S.N=GB(7,X)),
      /*ZP*/    0xA6 :()=> (X = RAM[RAM[PC+1]])                               & (S.Z=!X) & (S.N=GB(7,X)),
      /*ZPY*/   0xB6 :()=> (X = RAM[(RAM[PC+1]+D2H(Y)) % 0xFF])               & (S.Z=!X) & (S.N=GB(7,X)),
      /*ABS*/   0xAE :()=> (X = RAM[H2D(D2H(RAM[PC+2])+D2H(RAM[PC+1]))])      & (S.Z=!X) & (S.N=GB(7,X))  & (PC+=1),
      /*ABSY*/  0xBE :()=> (X = RAM[(H2D(D2H(RAM[PC+2])+D2H(RAM[PC+1]))+Y)])  & (S.Z=!X) & (S.N=GB(7,X))  & (PC+=1),
    // LDY, S[S,Z]
      /*IMM*/   0xA0 :()=> (Y = RAM[PC+1])                                    & (S.Z=!Y) & (S.N=GB(7,Y)),
      /*ZP*/    0xA4 :()=> (Y = RAM[RAM[PC+1]])                               & (S.Z=!Y) & (S.N=GB(7,Y)),
      /*ZPX*/   0xB4 :()=> (Y = RAM[(RAM[PC+1]+D2H(X)) % 0xFF])               & (S.Z=!Y) & (S.N=GB(7,Y)),
      /*ABS*/   0xAC :()=> (Y = RAM[H2D(D2H(RAM[PC+2])+D2H(RAM[PC+1]))])      & (S.Z=!Y) & (S.N=GB(7,Y))  & (PC+=1),
      /*ABSX*/  0xBC :()=> (Y = RAM[(H2D(D2H(RAM[PC+2])+D2H(RAM[PC+1]))+X)])  & (S.Z=!Y) & (S.N=GB(7,Y))  & (PC+=1),

  // STore
    // STA
      /*ZP*/    0x85 :()=> (RAM[RAM[PC+1]]                               = A),
      /*ZPX*/   0x95 :()=> (RAM[(RAM[PC+1]+D2H(X)) % 0xFF]               = A),
      /*ABS*/   0x8D :()=> (RAM[H2D(D2H(RAM[PC+2])+D2H(RAM[PC+1]))]      = A)                             & (PC+=1),
      /*ABSX*/  0x9D :()=> (RAM[(H2D(D2H(RAM[PC+2])+D2H(RAM[PC+1]))+X)]  = A)                             & (PC+=1),
      /*ABSY*/  0x99 :()=> (RAM[(H2D(D2H(RAM[PC+2])+D2H(RAM[PC+1]))+Y)]  = A)                             & (PC+=1),
      /*INDX*/  0x81 :()=> (RAM[H2D(D2H(X)+D2H(RAM[PC+1]))]              = A),
      /*INDY*/  0x91 :()=> (RAM[H2D(D2H(RAM[PC+1])+D2H(RAM[PC+1]+Y))+Y]  = A),
    // STY
      /*ZP*/    0x84 :()=> (RAM[RAM[PC+1]]                               = Y),
      /*ZPX*/   0x94 :()=> (RAM[(RAM[PC+1]+D2H(X)) % 0xFF]               = Y),
      /*ABS*/   0x8C :()=> (RAM[H2D(D2H(RAM[PC+2])+D2H(RAM[PC+1]))]      = Y)                             & (PC+=1),
    // STX
      /*ZP*/    0x86 :()=> (RAM[RAM[PC+1]]                               = X),
      /*ZPY*/   0x96 :()=> (RAM[(RAM[PC+1]+D2H(Y)) % 0xFF]               = X),
      /*ABS*/   0x8E :()=> (RAM[H2D(D2H(RAM[PC+2])+D2H(RAM[PC+1]))]      = X)                             & (PC+=1),

  // Register operators
    // Transfer                  Flags        PC                 // Unary                      Flags        PC
      /*TAX*/   0xAA :()=> (X=A) & (S.Z=!X)   & (PC-=1),           /*INX*/   0xE8 :()=> (X+=1) & (S.Z=!X)   & (PC-=1),
      /*TXA*/   0x8A :()=> (A=X) & (S.Z=!A)   & (PC-=1),           /*INY*/   0xC8 :()=> (Y+=1) & (S.Z=!Y)   & (PC-=1),
      /*TAY*/   0xA8 :()=> (Y=A) & (S.Z=!Y)   & (PC-=1),           /*DEX*/   0xCA :()=> (X-=1) & (S.Z=!X)   & (PC-=1),
      /*TYA*/   0x98 :()=> (A=Y) & (S.Z=!A)   & (PC-=1),           /*DEY*/   0x88 :()=> (Y-=1) & (S.Z=!Y)   & (PC-=1),

  // Arthimetic
    // ADC, S[S,V,Z,C]
      /*IMM*/   0x69 :()=> (A += RAM[PC+1])                                   & (S.Z=!A),
      /*ZP*/    0x65 :()=> (A += RAM[RAM[PC+1]])                              & (S.Z=!A),
      /*ZPX*/   0x75 :()=> (A += RAM[(RAM[PC+1]+D2H(X)) % 0xFF])              & (S.Z=!A),
      /*ABS*/   0x6D :()=> (A += RAM[H2D(D2H(RAM[PC+2])+D2H(RAM[PC+1]))])     & (S.Z=!A)                  & (PC+=1),
      /*ABSX*/  0x7D :()=> (A += RAM[(H2D(D2H(RAM[PC+2])+D2H(RAM[PC+1]))+X)]) & (S.Z=!A)                  & (PC+=1),
      /*ABSY*/  0x79 :()=> (A += RAM[(H2D(D2H(RAM[PC+2])+D2H(RAM[PC+1]))+Y)]) & (S.Z=!A)                  & (PC+=1),
      /*INDX*/  0x61 :()=> (A += RAM[H2D(D2H(X)+D2H(RAM[PC+1]))] )            & (S.Z=!A),
      /*INDY*/  0x71 :()=> (A += RAM[H2D(D2H(RAM[PC+1])+D2H(RAM[PC+1]+Y))+Y]) & (S.Z=!A),
    // SBC, S[S,V,Z,C]
      /*IMM*/   0xE9 :()=> (A -= RAM[PC+1])                                   & (S.Z=!A),
      /*ZP*/    0xE5 :()=> (A -= RAM[RAM[PC+1]])                              & (S.Z=!A),
      /*ZPX*/   0xF5 :()=> (A -= RAM[(RAM[PC+1]+D2H(X)) % 0xFF])              & (S.Z=!A),
      /*ABS*/   0xED :()=> (A -= RAM[H2D(D2H(RAM[PC+2])+D2H(RAM[PC+1]))])     & (S.Z=!A)                  & (PC+=1),
      /*ABSX*/  0xFD :()=> (A -= RAM[(H2D(D2H(RAM[PC+2])+D2H(RAM[PC+1]))+X)]) & (S.Z=!A)                  & (PC+=1),
      /*ABSY*/  0xF9 :()=> (A -= RAM[(H2D(D2H(RAM[PC+2])+D2H(RAM[PC+1]))+Y)]) & (S.Z=!A)                  & (PC+=1),
      /*INDX*/  0xE1 :()=> (A -= RAM[H2D(D2H(X)+D2H(RAM[PC+1]))] )            & (S.Z=!A),
      /*INDY*/  0xF1 :()=> (A -= RAM[H2D(D2H(RAM[PC+1])+D2H(RAM[PC+1]+Y))+Y]) & (S.Z=!A),
    // CMP                 // C=contents
      /*IMM*/   0xC9 :()=> (C = RAM[PC+1])                                    & (S.C=A>=C) & (S.Z=A==C),
      /*ZP*/    0xC5 :()=> (C = RAM[RAM[PC+1]])                               & (S.C=A>=C) & (S.Z=A==C),
      /*ZPX*/   0xD5 :()=> (C = RAM[(RAM[PC+1]+D2H(X)) % 0xFF])               & (S.C=A>=C) & (S.Z=A==C),
      /*ABS*/   0xCD :()=> (C = RAM[H2D(D2H(RAM[PC+2])+D2H(RAM[PC+1]))])      & (S.C=A>=C) & (S.Z=A==C)   & (PC+=1),
      /*ABSX*/  0xDD :()=> (C = RAM[(H2D(D2H(RAM[PC+2])+D2H(RAM[PC+1]))+X)])  & (S.C=A>=C) & (S.Z=A==C)   & (PC+=1),
      /*ABSY*/  0xD9 :()=> (C = RAM[(H2D(D2H(RAM[PC+2])+D2H(RAM[PC+1]))+Y)])  & (S.C=A>=C) & (S.Z=A==C)   & (PC+=1),
      /*INDX*/  0xC1 :()=> (C = RAM[H2D(D2H(X)+D2H(RAM[PC+1]))] )             & (S.C=A>=C) & (S.Z=A==C),
      /*INDY*/  0xD1 :()=> (C = RAM[H2D(D2H(RAM[PC+1])+D2H(RAM[PC+1]+Y))+Y])  & (S.C=A>=C) & (S.Z=A==C),
    // CPX
      /*IMM*/   0xE0 :()=> (C = RAM[PC+1])                                    & (S.C=X>=C) & (S.Z=X==C),
      /*ZP*/    0xE4 :()=> (C = RAM[RAM[PC+1]])                               & (S.C=X>=C) & (S.Z=X==C),
      /*ABS*/   0xEC :()=> (C = RAM[H2D(D2H(RAM[PC+2])+D2H(RAM[PC+1]))])      & (S.C=X>=C) & (S.Z=X==C)   & (PC+=1),
    // CPY
      /*IMM*/   0xC0 :()=> (C = RAM[PC+1])                                    & (S.C=Y>=C) & (S.Z=Y==C),
      /*ZP*/    0xC4 :()=> (C = RAM[RAM[PC+1]])                               & (S.C=Y>=C) & (S.Z=Y==C),
      /*ABS*/   0xCC :()=> (C = RAM[H2D(D2H(RAM[PC+2])+D2H(RAM[PC+1]))])      & (S.C=Y>=C) & (S.Z=Y==C)   & (PC+=1),

  // Logical (bitwise)
    // AND
      /*IMM*/   0x29 :()=> (A &= RAM[PC+1])                                   & (S.Z=!A),
      /*ZP*/    0x25 :()=> (A &= RAM[RAM[PC+1]])                              & (S.Z=!A),
      /*ZPX*/   0x35 :()=> (A &= RAM[(RAM[PC+1]+D2H(X)) % 0xFF])              & (S.Z=!A),
      /*ABS*/   0x2D :()=> (A &= RAM[H2D(D2H(RAM[PC+2])+D2H(RAM[PC+1]))])     & (S.Z=!A)                  & (PC+=1),
      /*ABSX*/  0x3D :()=> (A &= RAM[(H2D(D2H(RAM[PC+2])+D2H(RAM[PC+1]))+X)]) & (S.Z=!A)                  & (PC+=1),
      /*ABSY*/  0x39 :()=> (A &= RAM[(H2D(D2H(RAM[PC+2])+D2H(RAM[PC+1]))+Y)]) & (S.Z=!A)                  & (PC+=1),
      /*INDX*/  0x21 :()=> (A &= RAM[H2D(D2H(X)+D2H(RAM[PC+1]))] )            & (S.Z=!A),
      /*INDY*/  0x31 :()=> (A &= RAM[H2D(D2H(RAM[PC+1])+D2H(RAM[PC+1]+Y))+Y]) & (S.Z=!A),
    // EOR (XOR)
      /*IMM*/   0x49 :()=> (A ^= RAM[PC+1])                                   & (S.Z=!A),
      /*ZP*/    0x45 :()=> (A ^= RAM[RAM[PC+1]])                              & (S.Z=!A),
      /*ZPX*/   0x55 :()=> (A ^= RAM[(RAM[PC+1]+D2H(X)) % 0xFF])              & (S.Z=!A),
      /*ABS*/   0x4D :()=> (A ^= RAM[H2D(D2H(RAM[PC+2])+D2H(RAM[PC+1]))])     & (S.Z=!A)                  & (PC+=1),
      /*ABSX*/  0x5D :()=> (A ^= RAM[(H2D(D2H(RAM[PC+2])+D2H(RAM[PC+1]))+X)]) & (S.Z=!A)                  & (PC+=1),
      /*ABSY*/  0x59 :()=> (A ^= RAM[(H2D(D2H(RAM[PC+2])+D2H(RAM[PC+1]))+Y)]) & (S.Z=!A)                  & (PC+=1),
      /*INDX*/  0x41 :()=> (A ^= RAM[H2D(D2H(X)+D2H(RAM[PC+1]))] )            & (S.Z=!A),
      /*INDY*/  0x51 :()=> (A ^= RAM[H2D(D2H(RAM[PC+1])+D2H(RAM[PC+1]+Y))+Y]) & (S.Z=!A),
    // ORA (OR)
      /*IMM*/   0x09 :()=> (A |= RAM[PC+1])                                   & (S.Z=!A),
      /*ZP*/    0x05 :()=> (A |= RAM[RAM[PC+1]])                              & (S.Z=!A),
      /*ABS*/   0x0D :()=> (A |= RAM[H2D(D2H(RAM[PC+2])+D2H(RAM[PC+1]))])     & (S.Z=!A)                  & (PC+=1),
      /*ZPX*/   0x15 :()=> (A |= RAM[(RAM[PC+1]+D2H(X)) % 0xFF])              & (S.Z=!A),
      /*ABSX*/  0x1D :()=> (A |= RAM[(H2D(D2H(RAM[PC+2])+D2H(RAM[PC+1]))+X)]) & (S.Z=!A)                  & (PC+=1),
      /*ABSY*/  0x19 :()=> (A |= RAM[(H2D(D2H(RAM[PC+2])+D2H(RAM[PC+1]))+Y)]) & (S.Z=!A)                  & (PC+=1),
      /*INDX*/  0x01 :()=> (A |= RAM[H2D(D2H(X)+D2H(RAM[PC+1]))] )            & (S.Z=!A),
      /*INDY*/  0x11 :()=> (A |= RAM[H2D(D2H(RAM[PC+1])+D2H(RAM[PC+1]+Y))+Y]) & (S.Z=!A),
    // BIT                 // T=test
      /*ZP*/    0x24 :()=> (T = RAM[RAM[PC+1]] & A)                           & (S.Z=T>0),
      /*ABS*/   0x2C :()=> (T = RAM[H2D(D2H(RAM[PC+2])+D2H(RAM[PC+1]))] & A)  & (S.Z=T>0)                 & (PC+=1),
  // Shifts
    // ROL
      /*ACC*/   0x2A :()=> (A <<=1)                                           & (S.Z=!A)                  & (PC-=1),
      /*ZP*/    0x26 :()=> RAM[RAM[PC+1]]                              <<=1   & (S.Z=!A),
      /*ZPX*/   0x36 :()=> RAM[(RAM[PC+1]+D2H(X)) % 0xFF]              <<=1   & (S.Z=!A),
      /*ABS*/   0x2E :()=> RAM[H2D(D2H(RAM[PC+2])+D2H(RAM[PC+1]))]     <<=1   & (S.Z=!A)                  & (PC+=1),
      /*ABSX*/  0x3E :()=> RAM[(H2D(D2H(RAM[PC+2])+D2H(RAM[PC+1]))+X)] <<=1   & (S.Z=!A)                  & (PC+=1),
    // ROR
      /*ACC*/   0x6A :()=> (A >>=1)                                           & (S.Z=!A)                  & (PC-=1),
      /*ZP*/    0x66 :()=> RAM[RAM[PC+1]]                              >>=1   & (S.Z=!A),
      /*ZPX*/   0x76 :()=> RAM[(RAM[PC+1]+D2H(X)) % 0xFF]              >>=1   & (S.Z=!A),
      /*ABS*/   0x6E :()=> RAM[H2D(D2H(RAM[PC+2])+D2H(RAM[PC+1]))]     >>=1   & (S.Z=!A)                  & (PC+=1),
      /*ABSX*/  0x7E :()=> RAM[(H2D(D2H(RAM[PC+2])+D2H(RAM[PC+1]))+X)] >>=1   & (S.Z=!A)                  & (PC+=1),
    // ASL
      /*ACC*/   0x0A :()=> (A <<=1)                                           & (S.Z=!A)                  & (PC-=1),
      /*ZP*/    0x06 :()=> RAM[RAM[PC+1]]                              <<=1   & (S.Z=!A),
      /*ZPX*/   0x16 :()=> RAM[(RAM[PC+1]+D2H(X)) % 0xFF]              <<=1   & (S.Z=!A),
      /*ABS*/   0x0E :()=> RAM[H2D(D2H(RAM[PC+2])+D2H(RAM[PC+1]))]     <<=1   & (S.Z=!A)                  & (PC+=1),
      /*ABSX*/  0x1E :()=> RAM[(H2D(D2H(RAM[PC+2])+D2H(RAM[PC+1]))+X)] <<=1   & (S.Z=!A)                  & (PC+=1),
    // LSR
      /*ACC*/   0x4A :()=> (A >>>=1)                                          & (S.Z=!A)                  & (PC-=1),
      /*ZP*/    0x46 :()=> RAM[RAM[PC+1]]                              >>>=1  & (S.Z=!A),
      /*ZPX*/   0x56 :()=> RAM[(RAM[PC+1]+D2H(X)) % 0xFF]              >>>=1  & (S.Z=!A),
      /*ABS*/   0x4E :()=> RAM[H2D(D2H(RAM[PC+2])+D2H(RAM[PC+1]))]     >>>=1  & (S.Z=!A)                  & (PC+=1),
      /*ABSX*/  0x5E :()=> RAM[(H2D(D2H(RAM[PC+2])+D2H(RAM[PC+1]))+X)] >>>=1  & (S.Z=!A)                  & (PC+=1),
  
  // Memory operators
    // INC, S[S,Z]         // R=result
      /*ZP*/    0xE6 :()=> R=RAM[RAM[PC+1]]                              ++   & (S.Z=!R),
      /*ZPX*/   0xF6 :()=> R=RAM[(RAM[PC+1]+D2H(X)) % 0xFF]              ++   & (S.Z=!R),
      /*ABS*/   0xEE :()=> R=RAM[H2D(D2H(RAM[PC+2])+D2H(RAM[PC+1]))]     ++   & (S.Z=!R)                  & (PC+=1),
      /*ABSX*/  0xFE :()=> R=RAM[(H2D(D2H(RAM[PC+2])+D2H(RAM[PC+1]))+X)] ++   & (S.Z=!R)                  & (PC+=1),
    // DEC, S[S,Z]
      /*ZP*/    0xC6 :()=> R=RAM[RAM[PC+1]]                              --   & (S.Z=!R),
      /*ZPX*/   0xD6 :()=> R=RAM[(RAM[PC+1]+D2H(X)) % 0xFF]              --   & (S.Z=!R),
      /*ABS*/   0xCE :()=> R=RAM[H2D(D2H(RAM[PC+2])+D2H(RAM[PC+1]))]     --   & (S.Z=!R)                  & (PC+=1),
      /*ABSX*/  0xDE :()=> R=RAM[(H2D(D2H(RAM[PC+2])+D2H(RAM[PC+1]))+X)] --   & (S.Z=!R)                  & (PC+=1),

  // Stack
    // PusH
      /*PHA*/   0x48 :()=> (stack[SP+=1]=A)                                                                & (PC-=1),
    // PuLl (pop)
      /*PLA*/   0x68 :()=> (A=stack[SP-=1])                                    & (S.Z=!A)                  & (PC-=1),
    // Misc
      /*TXS*/   0x9A :()=> (stack[SP-1]=Status)                                                           & (PC-=1),
      /*TSX*/   0xBA :()=> (Status=stack[SP-1])                               & (S.Z=!X)                  & (PC-=1),
      /*PHP*/   0x08 :()=> (stack[SP-1]=Status)                                                           & (PC-=1),
      /*PLP*/   0x28 :()=> (Status=stack[SP-1])                               & (S.Z=!X)                  & (PC-=1),

  // Branches              // PCValue                  left<128 right>127
      /*BPL*/   0x10 :()=> (PCV=RAM[PC+1]) & S.N==0 && (PC+= PCV<128?PCV:-(0xFF-PCV)) & (PC-=1),
      /*BMI*/   0x30 :()=> (PCV=RAM[PC+1]) & S.N>0  && (PC+= PCV<128?PCV:-(0xFF-PCV)) & (PC-=1),
      /*BVC*/   0x50 :()=> (PCV=RAM[PC+1]) & S.V==0 && (PC+= PCV<128?PCV:-(0xFF-PCV)) & (PC-=1),
      /*BVS*/   0x70 :()=> (PCV=RAM[PC+1]) & S.V>0  && (PC+= PCV<128?PCV:-(0xFF-PCV)) & (PC-=1),
      /*BCC*/   0x90 :()=> (PCV=RAM[PC+1]) & S.C==0 && (PC+= PCV<128?PCV:-(0xFF-PCV)) & (PC-=1),
      /*BCS*/   0xB0 :()=> (PCV=RAM[PC+1]) & S.C>0  && (PC+= PCV<128?PCV:-(0xFF-PCV)) & (PC-=1),
      /*BNE*/   0xD0 :()=> (PCV=RAM[PC+1]) & S.Z==0 && (PC+= PCV<128?PCV:-(0xFF-PCV)) & (PC-=1),
      /*BEQ*/   0xF0 :()=> (PCV=RAM[PC+1]) & S.Z>0  && (PC+= PCV<128?PCV:-(0xFF-PCV)) & (PC-=1),

  // Status instructions
      /*CLC*/   0x18 :()=> (S.C=0) & (PC-=1),    /*CLV*/   0xB8 :()=> (S.V=0) & (PC-=1),
      /*SEC*/   0x38 :()=> (S.C=1) & (PC-=1),    /*CLD*/   0xD8 :()=> (S.D=0) & (PC-=1),
      /*CLI*/   0x58 :()=> (S.I=0) & (PC-=1),    /*SED*/   0xF8 :()=> (S.D=1) & (PC-=1),
      /*SEI*/   0x78 :()=> (S.I=1) & (PC-=1),

  // Program counter
    // JMP                                                                                                // Prevent tick from advancing PC after instruction
      /*ABS*/   0x4C :()=> (PC = H2D(D2H(RAM[PC+2])+D2H(RAM[PC+1])))                                      & (PC-=2),
      /*IND*/   0x6C :()=> (PC = RAM[H2D(D2H(RAM[PC+2])+D2H(RAM[PC+1]))])                                 & (PC-=2),
    // JSR & RTS           // Backup PC                                                                   // Prevent tick from advancing PC after instruction
      /*JSR*/   0x20 :()=> (TMP=PC) & (stack[SP+=1]=PC) & (PC=H2D(D2H(RAM[TMP+2])+D2H(RAM[TMP+1])))        & (PC-=2),
      /*RTS*/   0x60 :()=> (PC=(stack[SP-=1]+0x0600)-2) & (SP=Math.max(SP, 0)),

  // System
      /*RTI*/   0x40 :()=>                                                                                (PC-=1),
      /*NOP*/   0xEA :()=> /*NULL*/                                                                       (PC-=1),
      /*BRK*/   0x00 :()=> BRK() & ins[0x40]()
}

/**
 * Base256 en/de-coder
 */
const alpha64 = " !0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

const base256_decode = (str, decoded="", n=0)=>
{
  for ( let i=0; i<str.length ; i++ )
    for ( let j=0; j<alpha64.length ; j++ )
      if ( str[i] == alpha64[j] )
      {
        decoded = `${decoded}${"000000".substr(j.toString(2).length)+j.toString(2)}`;
        break;
      }

  return decoded.substr(0,256);
};

// 6 bits
const base256_encode = (str, encoded="")=>
{
  for ( let i=0; i<str.length/6; i++ )
    encoded = `${encoded}${alpha64[parseInt(str.substr(6*i,6),2)]}`;

  return encoded;
}

/**
 * Helper functions
 */
// Substitute BRK function & notifier
const BRK = ()=> console.warn(`Interrupted at PC[0x${(+PC).toString(16).toUpperCase()}] : 0x${D2H(ROM[PC])}`) & (running=false);

const MIN = Math.min;
const MAX = Math.max;
const MMS = (a,b)=> { return `${D2H(MAX(a,b))}${D2H(MIN(a,b))}` } // Concatenate A&B ascendantly

const GB  = (bit, byte) => { return byte >> bit & 1 }   // GetBit (read right-to-left)
const H2D = (hex=0x00) => { return parseInt('0x'+hex) } // Hex to Decimal
const D2H = (dec=0, alpha='0123456789ABCDEF') =>        // Decimal to Hex
  { return alpha[(dec-dec%16)/16] + alpha[dec%16] }

/**
 * CPU Controller
 */
let running = true,
    tickCounter = 0,
    stepCounter = 0;

// Auto step
const run = (hz=1)=>
{
  if ( stepCounter === 0 )
    stepCounter = setInterval(()=>{for(let i=0;i<hz;i++) step()}, 1000/60)
  else
    clearInterval(stepCounter) & (stepCounter=0);
}

// Clock
const step = ()=>
{
  if (!running) return;

  // Pre-calculations
  {
    // Random-byte generator
    RAM[0x00] = Math.round(Math.random()*0x100);
    RAM[0xfe] = Math.round(Math.random()*0x100);
  }

  // Execute next instruction
  exec(RAM[PC]);

  tickCounter++;

  // Advance program counter
  PC += 2;

  // Break if program finished
  PC >= RAM.length && BRK();
}

// Set Status Flags
const SF = (F={})=>
{
  // If F parameter is empty, return status byte
  if ( Object.keys(F) == 0 )
  {
    F = "";
    for ( let i in S ) F += S[i];
    return parseInt(F, 2);
  }

  for ( let i in F )
    S[i]>-1 && (S[i] = F[i] % 2);

  return F;
}
