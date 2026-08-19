import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { COLLECTIONS as fallbackCollections } from "../data";
import { Collection } from "../types";
import { X, Compass, Sparkles, SlidersHorizontal, Search, Check, RefreshCw } from "lucide-react";

interface FeaturedCollectionsProps {
  onBookClick: () => void;
  selectedSlabIds: string[];
  onTogglePreSelection: (col: Collection) => void;
  
  // Shared search/filter state from top bar
  searchQuery: string;
  setSearchQuery: React.Dispatch<React.SetStateAction<string>>;
  tempSearchQuery: string;
  setTempSearchQuery: React.Dispatch<React.SetStateAction<string>>;
  isSidebarOpen: boolean;
  setIsSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>;
  sortOption: string;
  setSortOption: React.Dispatch<React.SetStateAction<string>>;
  aiFilterQuery?: string;
  onApplyAiFilter?: (q: string) => void;
}


// ── Fallback image for missing/broken photo URLs ─────────────────────────────
const PLACEHOLDER_IMG = "data:image/png;base64,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AAgmsAAAggksAIBgAgsAIJjAAgAIJrAAAIIJLACAYAILACCYwAIACCawAACCCSwAgGACCwAgmMACAAgmsAAAggksAIBgAgsAIJjAAgAIJrAAAIIJLACAYAILACCYwAIACCawAACCCSwAgGACCwAgmMACAAgmsAAAggksAIBgAgsAIJjAAgAIJrAAAIIJLACAYAILACCYwAIACCawAACCCSwAgGACCwAgmMACAAgmsAAAggksAIBgAgsAIJjAAgAIJrAAAIIJLACAYJ3bewAANGjFihXjx41LXXLwIYc8/PDDzV0nOyPJ/qYgZwkscsjxxx23Zs2atIVXXHnltddeW+/6/3Txxc8880zqkp/ffffpp5/eVuPblczxX3X11d/+9rfbazzUOvmkk5YuXZq5/Mmnnho+fHj2xwN0BE4Rkuvu+d3v3nvvvfYeBflq/vz59dZVkiRTpkzJ8mCAjkNgkeu2bNnys5/9rL1HQb6a8uc/N/StqQ89VFNTk83BAB2HwCIPPPDHP65evbq9R0H+2b59+yOPPNLQd9esWTNnzpxsjgfoOFyDRR6oqqr6yZ133n7HHe09EPLMzJkzN27c2MgKU6ZM+cQnPpG18bTA0KFD3162rL1HATSbGSzyw9SpUxcvXtzeoyDP7PIqq79On75169bsDAboUMxgkR927Njx4zvu+MUvf9niLWzdunX69OkvvvDCa/Pnv79hw0cffdStW7fevXuPGDHiqKOOOuPMM4cMGRI44HotWrTotFNPTV1S99vpT8+c+cADD8yfP3/jxo0DBg48/PDDL7nkksMOO6xuzW3btk2bOnXKlClvv/325s2b+/fvf8wxx1x88cUHH3JIQz9u48aNCxYsePPNN998883ly5atX79+8+bN27Zt69Klyx577DFw4MCDRo8+7lOfOuXUU3fbbbfGR759+/YHH3zwkUceWbxo0aZNm/bcc89RBx10xhlnnH322cXFxT/9yU9++tOfpq7/rW9/++qrr25oUzNmzHj+uefmzZu3YcOGTZs27bbbbn369Bk9evQnP/nJc849t0ePHrt8JZti06ZNM596KnXJ7rvvfvzYsTP++te6JeXl5Y8/9thZZ5+dutrMp5669NJLU5ecf/75P7r99np/yi/uvvtHP/pR6pLvfOc7V151Ve2fW/8WRN3RIHBnyPTKK688OHnynDlz1q1bV1RUNGjQoPEnnvj5z39+n332ae6mMmVth4FYAouc1qlTp7rLkB977LHXXnsttTmaqKam5ne/+93dP//5Bx98kLq8rKysrKxs9erVTz/99I9//OMJEyb84F//tW/fvjFDb7KKiorrrr12+vTpdUtWrlixcsWKh6dN++Y113z9619PkuTtt9++4oorFi9aVLfO6tWrV69e/dBDD1173XWXX355vVs+9ZRTNmzYkLm8urp669atGzZseOONNyb/93/36dPnezfeeM455zQ0wqVLl1515ZWLUn762rVr165d+/TMmb+/557/uOuupj/Z//7Tn+68885169alLqyqqiorK1u1atVjjz12++23X3HllZdffnmnTp2avtl6PfrII5WVlalLTjr55IkTJ6YGVpIkU6ZMSQussSecMGDAgNRBzpgx499uvrlbt26ZP2XatGmpXxYXF593/vl1X0a9Ba3XRiOprKz8wfe//8ADD6QuLC0tLS0tvff3v//ejTdedNFFrRl2NncYiOUUITkt7aZWaVMFTVFZWfnlyy67+d/+La2u0uzYsePRRx+dOGHCm2++2exRtsL2qqqvXn55al2l+smdd957772rV6++8IILUuuqzo4dO2695Za0YmiujRs3fuuaa37961/X+91ly5Z99jOfWVTfT0+S5PXXX//sZz6zatWqXf6U6urqb3zjG9dff33awTLN5s2bb7v11i9fdllVVVVTBt+IzPODZ5xxxtixY/fYY4/Uhc8999z69etTlxQXF5973nmpS8rLy5988snMH7Fo0aK0V2bsCScMHDiwuUNt/C3IpmaNZHtV1VVXXplWV3UqKir+9/XX/9d997VsJNnfYSCWwCKnXXLJJf369av78vnnnnvh+eebtYVrv/Odp3Y+T9SIdevWXfqlL61du7ZZP6I1Fi5c+Oyzzzaywo9uu+2ySy9t/ErtH/7whzt27GjlSG695ZbS0tK0hbUHuXpnPuqsXbu2KTeU+u4NNzzS5BNbTz311P++/vomrlyv5cuXv/rqq6lLevToMXbs2K5du5500kmpy6urq9NmoZIkmTRpUtqShzPWSZJk6tSp6Q+88MKWDThp4C1oF00cycKFC+vtzlQ33XTTW2+91YIxZHmHgXACi5zWvaTkqp0v5WnWJNZjM2Zk/pb+xIkT/zJ9+sLS0jlz5373e9/r3r176nfXr19/0003tXjA4crLyxuaParT+O0GPv7xj//gX/912sMP//3llxcvWfLWwoVPP/30bbfdNnTo0NTVduzY8X9/9au0x06ePPmN119PW3ja6af/dcaMhaWls5555tLLLmvKs3h65sw//elPqUu6det21dVXP/7EE28uWPD8Cy/ceuut/fv3T11hypQpabfpb5bM21+dcsopXbp0SZJk4hln7HLlYcOGHX300Ts9haef3rRpU+qSmpqaR3feu/r27fvpneutVmveglhtMZJPfupTD02d+tbChXNfeun7P/hB2l+o7du333zzzc0dZ/Z3GAjnGixy3ec+97nf/Od/1t0Ha968eY8//vgpp5zSlMf+x3/8R9qS008//a7/f9vS/v37f+lLXxo8ePBXd76G6bEZMxYtWjRy5MhWj72pPvvZz17+1a/269dv7ty537rmmg8//DBznc9/4Qtf+cpX+vbtO3v27Gu/852ysrLU777y8svHHnts2kOOOeaYq66+etSoUakLi4uLhwwdOmTo0HHjx4874YSKioq6b2Uen+79/e/TlowbP/7nP/957fUu++677w033NClS5df/uIXjT/Bn/zkJ2lL7r777nHjx9f+uXv37hdOmvSxgw8+5+yzt2/fXrfOXXfdNXbs2Ma3XK+amprMuaW6rho7dmyPHj02b95c963S0tIFCxaMHj06df0LJ0166aWX6r6sqqr661//+pnPfKZuySsvv5x2e7bzzj+/c+ed/qfa+rcgShuN5Igjjrjnnntqn/Vuu+128cUXDxww4Iorrkhd54Xnn1+8ePEBBxzQ9NFmeYeBtmAGi1zXpUuXb3zzm6lL7rjjjqacEXvnnXcyz01c98//nLbklFNOOfzww1OX1NTUPPm3v7VgqC0zceLEH/6f/zNkyJCSkpJx48Z98YtfzFznzLPOuummmwYPHlxSUnLqqadmzhvV+2kwd/3sZ2kH1FT9+vU79NBDU5e8//7777zzTt2X69evX7hwYdqjrrvuurSria+++uqSkpKGfkqSJGvXrp0/f37qkjFjxtQdLOuMHj06LXFefeWVxs+NNuSll15KS5/evXsfd9xxtX/u0qXLySefnPaQhx56KG3JhAkTdt9999Ql03aOtmkZJ7AuzDg/2Mq3IFAbjeSab30rrSlPPe20gw8+OG212bNnN32o2d9hoC2YwSIPnHvuuf/3V7+quw/W4kWLpk2bdu655zb+qJfmzk1bMmzYsLRTIbXGjR8/b968nR770ktXZK7XNup+pb/WQTsfM/6xzpVXpn45ZsyYtBVS52NSVVVVzZo165lnnllUWrpy5cqysrItW7ZUV1c3NJgPPvig7lfr016TJEkGDhyYeZAuKSk55hOfmNnwhW6Zb8Qrr7yyXxM+ZXnHjh1vvPHG8ccfv8s102ReE3bKqaemdsDEiRPT1nl42rTrr7++uLi4bklJSckZZ5yReqJq7ty5a9eurb2Gvbq6evpf/pK6hSOOOKLeSZrWvAWxwkfStWvXzHnTJEnGnnDCG2+8kbrktddea/o4s7/DQFsQWOSBoqKib33rW6nnHX5y551nnnlm449an/ER0cMa+H/0sIzqytrHS/fo0eOggw5KXbLnnnumrdO7d+8DDzwwdUnPnj3T1qn3bpmPzZhx0003vfvuu00fT2qoZV7bPryBF3D4sGEzG95m478F1rjGr6+v17Zt2/6a8VuZZ+x83dXxY8f27Nnzo48+qlvy3nvvzZ49e9zOd5y6cNKk1MCqqal5+OGHv/KVryRJMnv27LTfS51U3/0IWvkWBGqLkQwaNCg1SesMzbilXLPexyzvMNBGnCIkP5x62mmppzBWrVr1wB//2PhDNqccPmt1r+8+RkmSdM84w/VRxmPbyMC9905b0rVr17QlgwYNSltSnXLdSa3MjyyeOnXqlVde2awDapIkqedeK8rL077b0KnAxk8RtubFLGt+bTz++ONpZdCnT5+0iZbOnTtnXsb3UMa815gxY9Impep+lzDtlwprp7vSHt76tyBKG40k7Xr2/1mesT80633M8g4DbURgkTe+c+21qV/eddddW7ZsaWT9HhnTPFsa+FCULSnX9tbKnCJqI5l3zc68X2K3jMPYjprMoNpJRUXF92+8sWZXqzVu953vF5U0/AJWNPpGtObFbMETyOykjRs3HjBixH7Dh6f+9+CDD6at9sQTT6T96kCSJBfsfFnVggULlixZsnXr1ieeeCJ1+YSJE9Mu2Ap5C0K03Uga+guY+Rdqj+bcbD3LOwy0EacIyRvHHXfcscce+8ILL9R++d577zV+OmCvnX+LO0mSFcuX17vm8hUr0pb0z3hsfnlm1qy0WZyioqLLv/rVs88+e5999qm70+YXv/CFRu7ClfkirFq5st41lzf6acSZ27nooov+/ZZbGnlIi23YsKFZ11On2rp16/S//CXtTN9555132623pl6oNG3atFGjRpXvPL2Xed+skLcgRNuNZM2aNdXV1ZlnCVdk7Cepd7PbpWzuMNB2zGCRT9ImsRr/R/lRO9/HKEmSZcuWrcxoqSRJZj39dNqSozMem1+WZRTPpEmTrr322pEjR6bexzxztVSZn0q0atWqzBewoqLixRdfbGQ7Hz/mmLQls2bN2p5xljPEtKlTG7lqe5cyr47fc889P/3pT6cueXjatLTzg/vtt99RRx2V9sCQtyBE242ksrKy3rf+mVmz0pY06xOusrnDQNsRWOSTI4444qT6buRYr0GDBqVdP54kye0ZH9n75JNPpt3yO0mSem8XmUcqMz42JPNz9O679941a9Y0spH+/fuPzviVxswbFP3sZz+ryDgllGrvvfdO+739tWvX3nbbbY08ZPny5TfffPMub6+VqSn3lG9E5v0dkiS5cOfZqVWrVv1t57t4XJgxfZUEvQUh2nQkd955Z1rRPjZjRtqvECZJ0qzf7MvmDgNtR2CRZ75z7bVFRU3db7/2ta+lLXn00Ue/8fWvL1y4sKqqasOGDffcc883vv71tHVOPe20bN5ltC3su+++aUvuv//++++///3339+yZcubb7553bXX/uAHP9jldjJvyjV16tTrrrtu6dKlVVVVq1at+uEPf9iUo9o3r7kmbcl//vrXl/zTP8186qkPPvigurq6rKxs5cqVTzzxxB133DHh9NNPHD/+t7/5TXMvdi4tLW3Zp7LUqampybwh1rhx4/baa6+01er+XFxcfN7OH1xYK+otaL02HckrL7/8pUsumT9/fmVl5fvvv3/vvfd++9vfTlvn2GOPbdZdRpNs7TDQplyDRZ4ZOXLkWWedlXmf7nqdetppEyZMSPso5UceeSTz83Pq9OvX73vf+14rB9nuxo0b161bt9R7N1RWVn73hhu+e8MNzdrO+Rdc8Ic//OH1nT8t58HJkx+cPLlZ2znxxBMvuOCCtOvKZ82aNSvjXFJr/DnjE2969uz54pw5mRM2db7x9a+n7QwPTZmS1uW1CfXLX/6y3i2MHz++3iv2ot6C1mvrkcyePbuR6946d+58w3e/29xtZmeHgTZlBov8881rrkm7eXRDOnXqdMePf3zCCSc0ccv9+/f/zW9/20a3ecymvn37Xr3zZzhmGnPkkbu81Ky4uPgnP/1p41coDxw48Pzzz9/lkP79llvOPOusXa7WYtXV1Zmfx3zOOec0UldJklyUcfOq5cuXv/LKK2kL6z0JWKve218lcW9B67XdSEaNGnXiiSc2vs6NN96YeaK5Kdp6h4G2JrDIP0OGDLko5SPhGrfbbrv99ne/+5d/+Zc+ffo0slpRUdHpp5/+l+nTDznkkIgxtr8rr7rq8ssvz7zpQ62TTz75t7/9bUP3MUo1fPjwPz7wwAENnDM95JBDHnjggQEDB6Ytz7z9RHFx8U9/+tMf3X57G/Xrs88+u379+rSFu9xPjv3kJ4dk3BUz80YPw4cPPzLjMvYkSfr37z8+4yNc6kS9Ba3XRiPp3KXL3b/4RUOJWVJS8u+33PL5L3yhuZut1dY7DLQ1pwjJS1/72tf+/OCD9d6+PFOnTp0u+/KX/9fnPz99+vQXnn/+9ddf37Bhw0cffdStW7fevXvvv//+Rx999Blnnlnvp+jktX++/vrTJ0z4r/vumzt37rp164qLi/v17z/miCPOOvvstFuWN27//ff/y1/+Mnny5EcfeaS0tHTz5s177rnnqFGjzjjzzLPPPru4uHhtxh0sM+9HX+v8888/55xzZs6c+dyzz86bN2/t2rWbNm3avn17jx49evTs2bNnz3577jly5MgDR40aNWrUiBEjmj7IzGunDj300MzfckjTqVOnSZMmpf3qw6OPPnrj97/fpUuX1IUXTZr08t//nvbw8847r95bmdeJegtar41G0rVr11tuueWCCy6YPHny3Dlz1q9fX1RUNGjQoPHjx3/hi19sfRu13Q4Dba1T5bbGfv2n7byz+h83StlncPo/H4E8UllZOfb449Nmj6Y89FDaR2gDZFn7loZThEBjFixY8N0bbnj//fcbWuG2W29Nq6u+ffumfq4RQAfkFCHQmOrq6vvvv//Pf/7zxIkTTzrppEMPO6xfv341NTXvvffevHnz/vBf/zVnzpy0h1x66aVNv5UGQEESWMCubdu2bcqUKU25jefHPvaxSy+7LAtDAshl/pUJhDn44IPvve++rl27tvdAANqZGSwgQJ8+fS677LIvf+UrTbxFGUBh879CoDEHH3zw40888fLLL7/8978vWbJk48aNH374YVlZWffu3Xv06DF48ODRo0d/4thjTzzxxLT7GgB0ZG7TAAAUILdpAAAoKAILACCYwAIACCawAACCCSwAgGACCwAgmMACAAgmsAAAggksAIBgAgsAIJjAAgAIJrAAAIIJLACAYAILACCYwAIACNa5vQcA5JzJf7p/04cffvrkUwcNHnzv737TlIeMOfLoMUcdXfvnmpqaB+6/r7ysrFu37p/7wsVFRfX8Q67uRwzfb/+mbH/1qpVLlyxev25dxZaKHdXV3bp132vAgGHD9xu+3/5p26/dct2XRUVF3bt379d/r1GjP7bvvkPqHUZDP/SU0yYMGTqs7ssPN2584/XX3n3nnfLysk6dOpXsvnuvXr2HDB02dOiw7iUlTXkWQMchsIBga1avKi8rS5Jk69YtK1csHzZ8v9ZsraKi4qm/Pb723XdSF5aXly17u2zZ20tffmnu2PEnDhy4d0MP37FjR3l5eXn5shXLlx0x5qgjj/54y4axdMniWTOf3LFjR92STR9+uOnDD1euWL5orwFnnXt+yzYLFCqBBTSoa9fdLrv8ytQli0oXPvP0U3337HfeBZMaelTpwreSJNl3yNBVK1eULnyrNYG1devWR6b+efPmzZ07dznoYx8bNny/Pn36dO7cZdvWrRs2vLfs7aVLFi967plZ50/6TNoD6+bGqqqqNn7wwUtzX3z3nTXzXn15xAEje/Xu3dDKDSkvK5s9a+aOHTv23nufw8cc2XfPfl27di0vK9u06cMVK5Zvqaho8RMECpXAAiJt27Zt5YrlXbp0GTf+03/64x9Wr1pZUV5esvvuLdvac7Nnbd68uXv37hPPPKd3nz51y7uXlOw7ZOi+Q4YeceRR8+fNa2QLXbp02WvAgFNOm3D/ffdUVVWtWbM6M7B2afnyZdu3b+/Ro8dpE88sLi6uXdizV6+evXrtO2Roc7cGdAQucgciLVlcWl1dPXy//Xfr1m3/ESNqamoWLy5t2aY+/HDjsreXJkly3NhxqXWVqkePnp86fuwuN9WlS5cePXslSbJt29YWjKSiojxJkn7996qrK4DGCSwg0qKFC5MkOWDkgUmSHDByVN2SFli1YkWSJLvvscfQYcNbOaqqysrNH21KkqTHHj1a8PDdS3ZPkmT9+nVVlZWtHAnQQQgsIMz7Gza8//6GHj167L3PoCRJ9howoHfvPps2fbh27bst2NqGDe8lSTJgwMDWDKmqqmrdurWPzZheVVXVrVu3oS26IGzYfvt37tylvKxsyoP//erLf3/3nTWVldtaMyqg4LkGCwhTunBBkiQjRh5Yt+SAAw98ac6Lixa+1cgv+jVk69atSZKUZNwB4fXX5s158fnUJRPPPLs26eo8+cRjaY/q3bvP+E+f3KVLl8wflLlykiTFxcWXXHZ57Z9LSkpOOW3C0089sXnzRy//fW7twl69eg3ad8jo0Qc3dPoS6MjMYAExqqurly5ZnPz/84O1RhxwYKdOnZa9vbSqqqrZW6ypSZIkSTq1fmzFxcWHjzlyz379WryFfQYNuuhzXxj/6ZNHHDCyV6/enTp12rRp04I3Xv/z5Aden/9a60cIFBgzWECM5cve3rZt28CBe/fs2atu4e677z5o8L6rV61ctnTJyFEHNWuD3bp3T5Jky5b0myAcctjhhxx2eO2f/3DvPZkrJCl3XqioqFiyqPTvL815+qm/de3aNfXGoZkrN664uHj/EQfsP+KAJEkqKyvffWfNa/NeXb9u7ZwXnuvXr1/aFBrQwQksIMai0oVJkqxd++5//uruzO+Wli5sbmD169d/6ZLF61p0/VadkpKSQw8/olNRpzkvPP/sM09P+uznO3cO+P9e165dhw4bvu+QoVOnPPjB+xuWLF4ssIBUThECAcrLyt5Zs7qRFdatfXfTpg+btc19hw5NkqSsrGzF8uWtGFqSJMnHDj60V6/eFRUVC954vZWbSlVUVLT33nsnSVJRXha4WaAAmMECAiwqXVhTU7PPoMETzjgr87tPPvHYsreXLlr41tHHHNv0bfbu3Wf4fvsve3vps7Of7tX77N69W34teVFR0eFjjpw188n5r80bffAhIZNYtd5bvz5JEp9FCKQxgwUEWLTof25/lal2+eJFpTX/uG69qT51/Ak9evTYUlExbcqDc+e8sH7dusrKypqamqrKyvXr1r7w3Ox/3Di0064vhN9/xAE9evTcunXLwrfebNYYkiR5ff68GdMfffON199bv768vGzHjh1btmxZs3rVjOmPrl+/LkmS/fYf0dxtAoXNDBbQWu+sWbP5o486d+7S0McODt53SLdu3SoqKlatXJF6mXm990dIkmTSZ/5Xz169kiTp1q3bmeec/9TfHlv77rvz5706f96raWsWFxcfefTHm3KvrKKiosMOP+LZ2bPmvzbvoNEHp96TvaFhjDny6DFHHZ0kyfbt21evWrl61cp6Vzv0sCMG7ztklwMAOhSBBbTWotK3kiQZtt9+9d5lKkmSoqKi/UYcsOCN1xeVLqz39/gaUVJScsZZ565etXLpksXr1q3dUlFRXV29227d+vTtO2jw4JEHHtS9e/cmbmrkqINefeXl8vKyRaVvHTT64KaP4dDDjujff6/Vq1auX7euvLx8y5aKoqKi3ffYY8CAgQeOOmhA82/xBRS8TpXb2udz4N9Z/Y9/C+4z2L/8AIBg7VsarsECAAgmsAAAggksAIBgAgsAIJjAAgAIJrAAAIIJLACAYAILACCYwAIACCawAACCCSwAgGACCwAgmMACAAgmsAAAggksAIBgAgsAIJjAAgAIJrAAAIIJLACAYAILACCYwAIACCawAACCCSwAgGACCwAgmMACAAgmsAAAggksAIBgAgsAIJjAAgAIJrAAAIIJLACAYAILACCYwAIACCawAACCCSwAgGACCwAgmMACAAgmsAAAggksAIBgAgsAIJjAAgAIJrAAAIIJLACAYAILACCYwAIACCawAACCCSwAgGACCwAgmMACAAgmsAAAggksAIBgAgsAIJjAAgAIJrAAAIIJLACAYAILACCYwAIACCawAACCCSwAgGACCwAgmMACAAgmsAAAggksAIBgAgsAIJjAAgAIJrAAAIIJLACAYAILACCYwAIACCawAACCCSwAgGACCwAgmMACAAgmsAAAggksAIBgAgsAIJjAAgAIJrAAAIIJLACAYAILACCYwAIACCawAACCCSwAgGACCwAgmMACAAgmsAAAggksAIBgAgsAIJjAAgAIJrAAAIIJLACAYAILACCYwAIACCawAACCCSwAgGACCwAgmMACAAgmsAAAggksAIBgAgsAIJjAAgAIJrAAAIIJLACAYAILACCYwAIACCawAACCCSwAgGACCwAgmMACAAgmsAAAggksAIBgAgsAIJjAAgAIJrAAAIIJLACAYAILACCYwAIACCawAACCCSwAgGACCwAgmMACAAgmsAAAggksAIBgAgsAIJjAAgAIJrAAAIIJLACAYAILACCYwAIACCawAACCCSwAgGACCwAgmMACAAgmsAAAggksAIBgAgsAIJjAAgAIJrAAAIIJLACAYAILACCYwAIACCawAACCCSwAgGACCwAgmMACAAgmsAAAggksAIBgAgsAIJjAAgAIJrAAAIIJLACAYAILACCYwAIACCawAACCCSwAgGACCwAgmMACAAgmsAAAggksAIBgAgsAIJjAAgAIJrAAAIIJLACAYAILACCYwAIACCawAACCCSwAgGACCwAgmMACAAgmsAAAggksAIBgAgsAIJjAAgAIJrAAAIIJLACAYAILACBY5/YeQPLO6pXtPQQAgEhmsAAAggksAIBgnSq3VbT3GAAACooZLACAYAILACCYwAIACCawAACCCSwAgGACCwAgmMACAAgmsAAAggksAIBgAgsAIJjAAgAIJrAAAIIJLACAYAILACCYwAIACCawAACCCSwAgGACCwAgmMACAAgmsAAAggksAIBgAgsAIJjAAgAIJrAAAIIJLACAYAILACCYwAIACCawAACCCSwAgGACCwAgmMACAAgmsAAAggksAIBgAgsAIJjAAgAIJrAAAIIJLACAYAILACDY/wOs/2lZKb2iFgAAAABJRU5ErkJggg==";

// Manually-pasted URL fields (like Product Photo) can contain links to a
// webpage instead of a direct image file — this catches the obvious cases
// before even attempting to load them. Airtable's own attachment CDN URLs
// don't always have a clean file extension, so we allowlist those hosts too.
function isValidImageUrl(url: string | undefined | null): boolean {
  if (!url || typeof url !== "string" || url.trim() === "") return false;
  const trimmed = url.trim();
  if (!/^https?:\/\//i.test(trimmed)) return false;

  // Known image file extensions (ignoring query string / fragment)
  const pathPart = trimmed.split(/[?#]/)[0];
  if (/\.(jpe?g|png|webp|gif|avif|svg|bmp|tiff?)$/i.test(pathPart)) return true;

  // Airtable's attachment CDN — signed URLs without a clean extension
  try {
    const hostname = new URL(trimmed).hostname;
    if (/(^|\.)airtableusercontent\.com$/i.test(hostname)) return true;
    if (/(^|\.)dl\.airtable\.com$/i.test(hostname)) return true;
  } catch {
    return false; // malformed URL — treat as invalid
  }

  return false;
}

// Resolves the best available image, falling back to the placeholder when
// the URL is missing or clearly not a direct image link.
function resolveImageUrl(...candidates: (string | undefined | null)[]): string {
  for (const c of candidates) {
    if (isValidImageUrl(c)) return c as string;
  }
  return PLACEHOLDER_IMG;
}


export default function FeaturedCollections({
  onBookClick,
  selectedSlabIds = [],
  onTogglePreSelection,
  searchQuery,
  setSearchQuery,
  tempSearchQuery,
  setTempSearchQuery,
  isSidebarOpen,
  setIsSidebarOpen,
  sortOption,
  setSortOption,
  aiFilterQuery,
  onApplyAiFilter
}: FeaturedCollectionsProps) {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCollection, setSelectedCollection] = useState<Collection | null>(null);
  const [activePhoto, setActivePhoto] = useState<string>("");

  // Reset activePhoto when a new collection is selected
  useEffect(() => {
    if (selectedCollection) {
      setActivePhoto(resolveImageUrl(selectedCollection.productPhotoUrl, selectedCollection.thumbnailUrl));
    }
  }, [selectedCollection]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Always collapse every filter section fresh, each time the drawer opens
  useEffect(() => {
    if (isFilterOpen) {
      setOpenSections({
        application: false,
        finishAndFeel: false,
        colorGroup: false,
        sizeFormat: false,
        visualLook: false
      });
    }
  }, [isFilterOpen]);
  const [visibleCount, setVisibleCount] = useState(24);

  useEffect(() => {
    let active = true;
    fetch("/api/collections")
      .then((res) => {
        if (!res.ok) throw new Error("Catalog fetch failed");
        return res.json();
      })
      .then((data) => {
        if (active) {
          setCollections(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.warn("Catalog fetch failed, using fallback static data:", err);
        if (active) {
          setCollections(fallbackCollections);
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, []);
  
  // Search & Filter Transition States
  const [isAiSearching, setIsAiSearching] = useState(false);
  const [aiSearchStatus, setAiSearchStatus] = useState("");

  const [selectedFinishAndFeels, setSelectedFinishAndFeels] = useState<string[]>([]);
  const [selectedColorGroups, setSelectedColorGroups] = useState<string[]>([]);
  const [selectedSizeFormats, setSelectedSizeFormats] = useState<string[]>([]);
  const [selectedVisualLooks, setSelectedVisualLooks] = useState<string[]>([]);
  const [selectedApplications, setSelectedApplications] = useState<string[]>([]);

  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    application: false,
    finishAndFeel: false,
    colorGroup: false,
    sizeFormat: false,
    visualLook: false
  });

  const toggleSection = (section: string) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  // Listen for custom trigger to view a collection (e.g., from AI search chatbot)
  useEffect(() => {
    const handleViewCollection = (e: Event) => {
      const customEvent = e as CustomEvent<{ id: string }>;
      if (customEvent.detail && customEvent.detail.id) {
        const col = collections.find(c => c.id === customEvent.detail.id);
        if (col) {
          setSelectedCollection(col);
          const element = document.getElementById("collections");
          if (element) {
            const offset = 80;
            const bodyRect = document.body.getBoundingClientRect().top;
            const elementRect = element.getBoundingClientRect().top;
            const elementPosition = elementRect - bodyRect;
            const offsetPosition = elementPosition - offset;
            window.scrollTo({
              top: offsetPosition,
              behavior: "smooth"
            });
          }
        }
      }
    };
    window.addEventListener("view-collection", handleViewCollection);
    return () => window.removeEventListener("view-collection", handleViewCollection);
  }, [collections]);

  // Listen for general prompt queries
  useEffect(() => {
    const handleAskSorenEvent = (e: Event) => {
      const customEvent = e as CustomEvent<{ query: string }>;
      if (customEvent.detail && customEvent.detail.query) {
        handleQuickSearch(customEvent.detail.query);
      }
    };
    window.addEventListener("ask-soren", handleAskSorenEvent);
    return () => window.removeEventListener("ask-soren", handleAskSorenEvent);
  }, []);

  // Toggle helpers
  const toggleFilter = (list: string[], setList: React.Dispatch<React.SetStateAction<string[]>>, value: string) => {
    if (list.includes(value)) {
      setList(list.filter(item => item !== value));
    } else {
      setList([...list, value]);
    }
  };

  const handleClearFilters = () => {
    setSearchQuery("");
    setTempSearchQuery("");
    setSelectedFinishAndFeels([]);
    setSelectedColorGroups([]);
    setSelectedSizeFormats([]);
    setSelectedVisualLooks([]);
    setSelectedApplications([]);
  };

  useEffect(() => {
    setVisibleCount(24);
  }, [searchQuery, selectedFinishAndFeels, selectedColorGroups, selectedSizeFormats, selectedVisualLooks, selectedApplications]);

  // Filter open/close events
  useEffect(() => {
    const openHandler = () => setIsFilterOpen(true);
    const closeHandler = () => setIsFilterOpen(false);
    window.addEventListener("open-filter", openHandler);
    window.addEventListener("close-filter", closeHandler);
    return () => {
      window.removeEventListener("open-filter", openHandler);
      window.removeEventListener("close-filter", closeHandler);
    };
  }, []);

  // Close modal event from tour
  useEffect(() => {
    const handler = () => setSelectedCollection(null);
    window.addEventListener("close-modal", handler);
    return () => window.removeEventListener("close-modal", handler);
  }, []);

  // Listen for search from nav bar
  useEffect(() => {
    const handler = (e: Event) => {
      const ce = e as CustomEvent<{query: string}>;
      setSearchQuery(ce.detail.query);
      setTempSearchQuery(ce.detail.query);
    };
    window.addEventListener("nav-search", handler);
    return () => window.removeEventListener("nav-search", handler);
  }, []);

  // Listen for sort from nav bar
  useEffect(() => {
    const handler = (e: Event) => {
      const ce = e as CustomEvent<{sort: string}>;
      setSortOption(ce.detail.sort);
    };
    window.addEventListener("nav-sort", handler);
    return () => window.removeEventListener("nav-sort", handler);
  }, []);

  // Listen to external searchQuery updates to trigger visual search scan feedback
  useEffect(() => {
    if (searchQuery.trim()) {
      setIsAiSearching(true);
      setAiSearchStatus("Scanning lot catalog database...");
      const timer1 = setTimeout(() => {
        setAiSearchStatus("Filtering material specifications...");
        const timer2 = setTimeout(() => {
          setIsAiSearching(false);
        }, 300);
        return () => clearTimeout(timer2);
      }, 300);
      return () => clearTimeout(timer1);
    } else {
      setIsAiSearching(false);
    }
  }, [searchQuery]);

  // Search submission helper
  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSearchQuery(tempSearchQuery);
  };

  // Quick pre-selected search handles
  const handleQuickSearch = (query: string) => {
    setTempSearchQuery(query);
    setSearchQuery(query);
  };

  // Filter collections based on selections
  const filteredCollections = collections.filter(col => {
    // 1. Search Query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      
      const fFeel = getFinishAndFeel(col).toLowerCase();
      const finish = col.finish.toLowerCase();
      const cGroup = getColorGroup(col).toLowerCase();
      const sFormat = (col.sizeAndFormat || "Porcelain Slabs & Panels").toLowerCase();
      const thick = (col.thickness || getThickness(col)).toLowerCase();
      const vLook = getVisualLook(col).toLowerCase();
      const mStyle = getMaterialStyle(col).toLowerCase();
      const apps = col.applications.map(a => a.toLowerCase());
      const formats = col.formats.map(f => f.replace("×", "x").toLowerCase());
      const name = col.name.toLowerCase();
      const category = col.category.toLowerCase();
      const origin = col.origin.toLowerCase();
      
      const matchesName = name.includes(query);
      const matchesFinishAndFeel = fFeel.includes(query);
      const matchesFinish = finish.includes(query);
      const matchesColorGroup = cGroup.includes(query);
      const matchesSizeAndFormat = sFormat.includes(query);
      const matchesThickness = thick.includes(query);
      const matchesVisualLook = vLook.includes(query);
      const matchesMaterialStyle = mStyle.includes(query);
      const matchesApplication = apps.some(a => a.includes(query));
      const matchesSlabFormat = formats.some(f => f.includes(query)) || name.includes(query);
      const matchesCategory = category.includes(query);
      const matchesOrigin = origin.includes(query);

      if (!matchesName && 
          !matchesFinishAndFeel && 
          !matchesFinish && 
          !matchesColorGroup && 
          !matchesSizeAndFormat && 
          !matchesThickness && 
          !matchesVisualLook && 
          !matchesMaterialStyle && 
          !matchesApplication && 
          !matchesSlabFormat &&
          !matchesCategory &&
          !matchesOrigin) {
        return false;
      }
    }

    // 2. Finish & Feel — OR within category
    if (selectedFinishAndFeels.length > 0) {
      const val = getFinishAndFeel(col).toLowerCase();
      const matches = selectedFinishAndFeels.some(s => 
        val.includes(s.toLowerCase()) || s.toLowerCase().includes(val)
      );
      if (!matches) return false;
    }

    // 4. Color Group — OR within category
    if (selectedColorGroups.length > 0) {
      const val = getColorGroup(col).toLowerCase();
      const matches = selectedColorGroups.some(s => 
        val.includes(s.toLowerCase()) || s.toLowerCase().includes(val)
      );
      if (!matches) return false;
    }

    // 5. Size & Format
    if (selectedSizeFormats.length > 0) {
      const val = col.sizeAndFormat || "Porcelain Slabs & Panels";
      if (!selectedSizeFormats.includes(val)) return false;
    }

    // 7. Visual Look — OR within category
    if (selectedVisualLooks.length > 0) {
      const val = getVisualLook(col).toLowerCase();
      const matches = selectedVisualLooks.some(s => 
        val.includes(s.toLowerCase()) || s.toLowerCase().includes(val)
      );
      if (!matches) return false;
    }

    // 9. Application
    if (selectedApplications.length > 0) {
      const hasMatch = col.applications.some(app => selectedApplications.includes(app));
      if (!hasMatch) return false;
    }


    return true;
  });

  // Apply sorting to the filtered list
  const sortedAndFilteredCollections = [...filteredCollections].sort((a, b) => {
    if (sortOption === "name-asc") {
      return a.name.localeCompare(b.name);
    } else if (sortOption === "name-desc") {
      return b.name.localeCompare(a.name);
    } else if (sortOption === "thickness") {
      const getThick = (col: Collection) => {
        const val = col.thickness || getThickness(col);
        return parseFloat(val) || 0;
      };
      return getThick(a) - getThick(b);
    } else if (sortOption === "category") {
      return a.category.localeCompare(b.category);
    }
    return 0; // Default
  });

  return (
    <>
    <style>{`@keyframes bounce { 0%,100%{transform:translateY(0);opacity:0.4} 50%{transform:translateY(-4px);opacity:1} }`}</style>
    <section id="collections" className="relative w-full bg-[#FAF9F6] py-8 border-t border-[#f39b34]/15">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        
        {/* Filter Drawer Overlay */}
        <AnimatePresence>
          {isFilterOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsFilterOpen(false)}
                className="fixed inset-0 z-40"
                style={{background:"rgba(0,0,0,0.5)"}}
              />
              <motion.div
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ type: "tween", duration: 0.25 }}
                id="tour-filter-drawer" className="fixed right-0 top-0 h-full w-full sm:w-96 z-50 flex flex-col shadow-2xl"
                style={{background:"#ffffff"}}
              >
                <div className="flex items-center justify-between px-4 py-4 sm:px-6 sm:py-5 border-b border-neutral-100" style={{background:"#1C1A17"}}>
                  <div className="flex items-center space-x-2">
                    <SlidersHorizontal size={16} style={{color:"#f39b34"}} />
                    <span className="text-sm font-bold uppercase tracking-widest" style={{color:"#ffffff"}}>Filter Results</span>
                  </div>
                  <div className="flex items-center space-x-4">
                    {(selectedFinishAndFeels.length > 0 || selectedColorGroups.length > 0 || selectedSizeFormats.length > 0 || selectedVisualLooks.length > 0 || selectedApplications.length > 0) && (
                      <button onClick={handleClearFilters} className="text-xs font-mono uppercase tracking-wider cursor-pointer" style={{color:"#f39b34"}}>Clear All</button>
                    )}
                    <button onClick={() => setIsFilterOpen(false)} className="cursor-pointer" style={{color:"rgba(255,255,255,0.6)"}}>
                      <X size={18} />
                    </button>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto">
                  {[
                    { key: "application", label: "Application", options: [...new Set(collections.flatMap(c => c.applications).filter(Boolean))].sort() as string[], list: selectedApplications, setList: setSelectedApplications },
                    { key: "finishAndFeel", label: "Finish & Feel", options: [...new Set(collections.map(c => getFinishAndFeel(c)).filter(Boolean))].sort() as string[], list: selectedFinishAndFeels, setList: setSelectedFinishAndFeels },
                    { key: "colorGroup", label: "Color Group", options: [...new Set(collections.map(c => getColorGroup(c)).filter(Boolean))].sort() as string[], list: selectedColorGroups, setList: setSelectedColorGroups },
                    { key: "sizeFormat", label: "Size & Format", options: [...new Set(collections.map(c => c.sizeAndFormat).filter(Boolean))].sort() as string[], list: selectedSizeFormats, setList: setSelectedSizeFormats },
                    { key: "visualLook", label: "Visual Look", options: [...new Set(collections.map(c => getVisualLook(c)).filter(Boolean))].sort() as string[], list: selectedVisualLooks, setList: setSelectedVisualLooks },
                  ].map(({ key, label, options, list, setList }) => (
                    <div key={key} className="border-b border-neutral-100">
                      <button
                        onClick={() => toggleSection(key)}
                        className="w-full flex items-center justify-between px-4 py-4 sm:px-6 sm:py-5 text-left cursor-pointer hover:bg-neutral-50 transition-colors"
                      >
                        <div className="flex items-center space-x-3">
                          <span className="text-sm sm:text-base font-semibold" style={{color:"#1C1A17"}}>{label}</span>
                          {list.length > 0 && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{background:"#f39b34",color:"#000"}}>{list.length}</span>
                          )}
                        </div>
                        <span className="text-lg" style={{color:"#9a9690"}}>{openSections[key] ? "−" : "+"}</span>
                      </button>
                      {openSections[key] && (
                        <div className="px-4 pb-4 space-y-3 sm:px-6 sm:pb-5 sm:space-y-4">
                          {options.map(val => {
                            const isChecked = list.includes(val);
                            return (
                              <label key={val} className="flex items-center space-x-3 cursor-pointer group">
                                <input type="checkbox" checked={isChecked} onChange={() => toggleFilter(list, setList, val)} className="sr-only" />
                                <div className={`w-4 h-4 sm:w-5 sm:h-5 border-2 transition-all flex items-center justify-center rounded-sm flex-shrink-0 ${isChecked ? "border-[#f39b34] bg-[#f39b34]" : "border-neutral-300 group-hover:border-[#f39b34]/50"}`}>
                                  {isChecked && <Check size={12} strokeWidth={3} style={{color:"#000"}} />}
                                </div>
                                <span className="text-sm sm:text-base" style={{color: isChecked ? "#1C1A17" : "#6b6762"}}>{val}</span>
                              </label>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div className="p-5 border-t border-neutral-100">
                  <button
                    onClick={() => setIsFilterOpen(false)}
                    className="w-full py-4 text-sm font-bold uppercase tracking-widest cursor-pointer transition-colors"
                    style={{background:"#1C1A17",color:"#ffffff"}}
                  >
                    Show {sortedAndFilteredCollections.length} Results
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Full Width Grid */}
        <div className="flex flex-col space-y-6">
            
            {/* Active Filter Pills */}
            {(selectedFinishAndFeels.length > 0 || selectedColorGroups.length > 0 || selectedSizeFormats.length > 0 || selectedVisualLooks.length > 0 || selectedApplications.length > 0 || searchQuery) && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[9px] font-mono uppercase tracking-wider" style={{color:"#9a9690"}}>My Filters:</span>
                {searchQuery && <button onClick={() => { setSearchQuery(""); setTempSearchQuery(""); }} className="flex items-center gap-1 text-[10px] font-mono px-3 py-1 rounded-full border cursor-pointer" style={{background:"rgba(243,155,52,0.1)",borderColor:"rgba(243,155,52,0.4)",color:"#1C1A17"}}>Search: {searchQuery} <X size={9} /></button>}
                {selectedApplications.map(v => <button key={v} onClick={() => toggleFilter(selectedApplications, setSelectedApplications, v)} className="flex items-center gap-1 text-[10px] font-mono px-3 py-1 rounded-full border cursor-pointer" style={{background:"rgba(243,155,52,0.1)",borderColor:"rgba(243,155,52,0.4)",color:"#1C1A17"}}>{v} <X size={9} /></button>)}
                {selectedFinishAndFeels.map(v => <button key={v} onClick={() => toggleFilter(selectedFinishAndFeels, setSelectedFinishAndFeels, v)} className="flex items-center gap-1 text-[10px] font-mono px-3 py-1 rounded-full border cursor-pointer" style={{background:"rgba(243,155,52,0.1)",borderColor:"rgba(243,155,52,0.4)",color:"#1C1A17"}}>{v} <X size={9} /></button>)}
                {selectedColorGroups.map(v => <button key={v} onClick={() => toggleFilter(selectedColorGroups, setSelectedColorGroups, v)} className="flex items-center gap-1 text-[10px] font-mono px-3 py-1 rounded-full border cursor-pointer" style={{background:"rgba(243,155,52,0.1)",borderColor:"rgba(243,155,52,0.4)",color:"#1C1A17"}}>{v} <X size={9} /></button>)}
                {selectedSizeFormats.map(v => <button key={v} onClick={() => toggleFilter(selectedSizeFormats, setSelectedSizeFormats, v)} className="flex items-center gap-1 text-[10px] font-mono px-3 py-1 rounded-full border cursor-pointer" style={{background:"rgba(243,155,52,0.1)",borderColor:"rgba(243,155,52,0.4)",color:"#1C1A17"}}>{v} <X size={9} /></button>)}
                {selectedVisualLooks.map(v => <button key={v} onClick={() => toggleFilter(selectedVisualLooks, setSelectedVisualLooks, v)} className="flex items-center gap-1 text-[10px] font-mono px-3 py-1 rounded-full border cursor-pointer" style={{background:"rgba(243,155,52,0.1)",borderColor:"rgba(243,155,52,0.4)",color:"#1C1A17"}}>{v} <X size={9} /></button>)}
                <button onClick={handleClearFilters} className="text-[10px] font-mono hover:underline cursor-pointer uppercase tracking-wider" style={{color:"#f39b34"}}>Clear All</button>
              </div>
            )}

            {/* AI Filter Suggestion Banner */}
            {aiFilterQuery && onApplyAiFilter && (
              <div className="flex items-center justify-between bg-[#f39b34]/10 border border-[#f39b34]/30 px-4 py-2.5 rounded-sm">
                <div className="flex items-center space-x-2">
                  <Sparkles size={12} className="text-[#f39b34]" />
                  <span className="text-[10px] font-mono text-[#1C1A17]/70 uppercase tracking-wider">
                    TileAI suggests filtering by <span className="text-[#f39b34] font-bold">"{aiFilterQuery}"</span>
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => onApplyAiFilter(aiFilterQuery)}
                    className="text-[9px] font-bold uppercase tracking-wider bg-[#f39b34] text-black px-3 py-1 rounded-sm cursor-pointer hover:bg-[#e28b24] transition-colors"
                  >
                    Apply
                  </button>
                  <button
                    onClick={() => onApplyAiFilter("")}
                    className="text-[9px] font-mono text-[#1C1A17]/40 hover:text-[#1C1A17] cursor-pointer transition-colors"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            )}

            {/* Loader / Empty States */}
            <AnimatePresence mode="wait">
              {loading ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col space-y-4"
                >
                  {/* Loading banner */}
                  <div className="flex items-center gap-3 px-4 py-3 bg-[#1C1A17] border border-[#f39b34]/20 rounded-sm">
                    <div className="relative flex-shrink-0">
                      <div className="absolute inset-0 rounded-full bg-[#f39b34]/30 blur-md animate-pulse" />
                      <Sparkles size={16} className="text-[#f39b34] animate-spin relative z-10" style={{ animationDuration: "2.5s" }} />
                    </div>
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-widest text-white">Loading catalog</p>
                      <p className="text-[9px] font-mono text-white/35 uppercase tracking-widest">Fetching lot inventory from database...</p>
                    </div>
                    <div className="ml-auto flex gap-1">
                      {[0,1,2].map(i => (
                        <div key={i} className="w-1.5 h-1.5 rounded-full bg-[#f39b34]" style={{ animation: `bounce 1s ease-in-out ${i * 0.15}s infinite` }} />
                      ))}
                    </div>
                  </div>
                  {/* Skeleton grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                    {Array.from({ length: 12 }).map((_, i) => (
                      <div key={i} className="bg-white border border-neutral-100 rounded-sm overflow-hidden animate-pulse">
                        <div className="aspect-square bg-gradient-to-br from-neutral-100 to-neutral-200" />
                      </div>
                    ))}
                  </div>
                </motion.div>
              ) : isAiSearching ? (
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  className="w-full bg-white border border-neutral-200 shadow-sm p-16 text-center flex flex-col items-center justify-center space-y-4 rounded-sm"
                >
                  <div className="relative">
                    <div className="absolute inset-0 rounded-full bg-[#f39b34]/20 blur-xl animate-pulse" />
                    <Sparkles size={32} className="text-[#f39b34] animate-spin relative z-10" style={{ animationDuration: "3s" }} />
                  </div>
                  <div>
                    <h3 className="font-sans text-sm text-[#1C1A17] uppercase tracking-wider mb-1">
                      {aiSearchStatus}
                    </h3>
                    <p className="text-[9px] font-mono text-[#1C1A17]/40 uppercase tracking-widest">
                      Cross-referencing database with live lot numbers
                    </p>
                  </div>
                </motion.div>
              ) : sortedAndFilteredCollections.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="w-full bg-white border border-neutral-200 shadow-sm p-16 text-center flex flex-col items-center justify-center space-y-4 rounded-sm"
                >
                  <Compass size={32} className="text-neutral-300" />
                  <div>
                    <h3 className="font-serif text-lg text-[#1C1A17] font-light mb-1">
                      No matching slab spec sheets found.
                    </h3>
                    <p className="text-[11px] text-neutral-500 max-w-sm leading-relaxed mx-auto">
                      Please refine your parameters or click reset below to inspect the full list of products in Table 1.
                    </p>
                  </div>
                  <button
                    onClick={handleClearFilters}
                    className="px-4 py-2 border border-[#f39b34]/50 text-[#f39b34] hover:bg-[#f39b34] hover:text-white bg-white shadow-sm text-[10px] font-bold tracking-widest uppercase transition-all cursor-pointer rounded-sm"
                  >
                    Reset Explorer
                  </button>
                </motion.div>
              ) : (
                /* Pure High-Density Grid styled 100% like the requested mockup */
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                  className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 items-start"
                >
                  {sortedAndFilteredCollections.slice(0, visibleCount).map((col, cardIndex) => {
                    const isPreSelected = selectedSlabIds.includes(col.id);
                    return (
                      <div
                        key={col.id}
                        id={cardIndex === 0 ? "tour-first-card" : undefined}
                        onClick={() => setSelectedCollection(col)}
                        className="group bg-white border border-neutral-100 hover:border-[#f39b34]/40 hover:shadow-md transition-all duration-300 flex flex-col rounded-sm overflow-hidden cursor-pointer"
                      >
                        {/* Photo — fills the card, square aspect ratio */}
                        <div className="relative w-full aspect-square overflow-hidden bg-[#f0ede8]">
                          <img
                            src={resolveImageUrl(col.thumbnailUrl, col.productPhotoUrl)}
                            alt={col.name}
                            loading="lazy"
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                            onError={(e) => {
                              const el = e.target as HTMLImageElement;
                              if (el.src !== PLACEHOLDER_IMG) el.src = PLACEHOLDER_IMG;
                            }}
                          />
                          {/* Finish tag top-left — hidden on mobile per "flat image" request */}
                          <div className="hidden sm:flex absolute top-2.5 left-2.5 gap-1">
                            <span className="text-[7px] font-mono tracking-widest uppercase bg-black/60 px-1.5 py-0.5 backdrop-blur-sm" style={{color:"#ffffff"}}>
                              {col.finish}
                            </span>
                            <span className="text-[7px] font-mono tracking-widest uppercase bg-black/60 px-1.5 py-0.5 backdrop-blur-sm" style={{color:"rgba(255,255,255,0.85)"}}>
                              {col.category.split(" ")[0]}
                            </span>
                          </div>

                          {/* Pre-select button top-right */}
                          <button
                            id={cardIndex === 0 ? "tour-preselect" : undefined}
                            onClick={(e) => {
                              e.stopPropagation();
                              onTogglePreSelection(col);
                            }}
                            className={`absolute top-2.5 right-2.5 text-[7px] font-bold tracking-wider uppercase px-2 py-1 transition-all cursor-pointer rounded-sm ${
                              isPreSelected
                                ? "bg-[#f39b34] text-black"
                                : "bg-black/60 text-white/80 hover:bg-[#f39b34] hover:text-black backdrop-blur-sm"
                            }`}
                          >
                            {isPreSelected ? "✓" : "+"}
                          </button>

                          {/* Name at bottom over gradient — hidden on mobile per "flat image" request */}
                          <div className="hidden sm:block absolute bottom-0 left-0 right-0 p-3">
                            <h3 className="font-sans text-[10px] font-bold tracking-wide leading-tight uppercase truncate" style={{color:"#ffffff",textShadow:"0 2px 8px rgba(0,0,0,1),0 0 20px rgba(0,0,0,1)"}}>
                              {col.name}
                            </h3>
                            <p className="text-[8px] font-mono uppercase mt-0.5" style={{color:"rgba(255,255,255,0.9)",textShadow:"0 2px 6px rgba(0,0,0,1)"}}>
                              {col.sizeAndFormat || col.specs}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Load More */}
            {visibleCount < sortedAndFilteredCollections.length && (
              <div className="flex justify-center pt-8">
                <button
                  onClick={() => setVisibleCount(prev => prev + 24)}
                  className="px-8 py-4 text-xs font-bold uppercase tracking-widest cursor-pointer transition-colors border-2"
                  style={{borderColor:"rgba(243,155,52,0.4)",color:"#f39b34",background:"#ffffff"}}
                >
                  Load More <span className="opacity-60 ml-1">({visibleCount} of {sortedAndFilteredCollections.length})</span>
                </button>
              </div>
            )}

          </div>

      </div>

      {/* Luxury Collection Detail Drawer Modal — id for tour */}
      <AnimatePresence>
        {selectedCollection && (
          <div id="tour-detail-modal" className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-0 sm:p-4 overflow-y-auto">
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.75 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedCollection(null)}
              className="fixed inset-0 bg-neutral-900/60 backdrop-blur-xs"
            />

            {/* Modal Body */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", damping: 25 }}
              className="relative w-full max-w-4xl bg-white border-0 sm:border border-neutral-200 overflow-hidden grid grid-cols-1 md:grid-cols-2 shadow-2xl rounded-none sm:rounded-sm z-10 my-0 sm:my-8"
            >
              {/* Left Side: Photo Gallery */}
              <div className="relative h-[340px] sm:h-[380px] md:h-full md:min-h-[360px] border-b md:border-b-0 md:border-r border-neutral-200 flex flex-col overflow-hidden bg-[#1C1A17]">
                
                {/* Main photo */}
                <div className="relative flex-1 overflow-hidden bg-[#1C1A17]">
                  <div className="absolute inset-0" style={{ background: selectedCollection.backgroundGradient, opacity: 0.35 }} />
                  <img
                    src={isValidImageUrl(activePhoto) ? activePhoto : PLACEHOLDER_IMG}
                    alt={selectedCollection.name}
                    referrerPolicy="no-referrer"
                    className="absolute inset-0 w-full h-full object-contain transition-opacity duration-300"
                    onError={(e) => {
                      const el = e.target as HTMLImageElement;
                      if (el.src !== PLACEHOLDER_IMG) el.src = PLACEHOLDER_IMG;
                    }}
                  />

                  {/* Mobile close */}
                  <button
                    onClick={() => setSelectedCollection(null)}
                    className="absolute top-3 left-3 z-10 p-2 rounded-full bg-[#0a0a0a]/80 hover:bg-[#f39b34] text-white hover:text-[#0a0a0a] transition-all md:hidden cursor-pointer"
                  >
                    <X size={15} />
                  </button>

                  {/* Download + Copy buttons on active photo */}
                  {activePhoto && (
                    <div className="absolute bottom-3 right-3 z-10 flex gap-2">
                      <a
                        href={`/api/download?url=${encodeURIComponent(activePhoto)}&filename=${encodeURIComponent(selectedCollection.name.replace(/\s+/g, "-").toLowerCase() + ".jpg")}`}
                        download
                        className="flex items-center gap-1.5 px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider bg-[#0a0a0a]/80 hover:bg-[#f39b34] text-white hover:text-black transition-all rounded-sm cursor-pointer backdrop-blur-sm"
                        title="Download photo — or right-click the image and choose Save Image As"
                      >
                        ↓ Download
                      </a>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(activePhoto).then(() => {
                            const btn = document.getElementById("copy-btn");
                            if (btn) { btn.textContent = "✓ Copied"; setTimeout(() => { btn.textContent = "Copy URL"; }, 2000); }
                          });
                        }}
                        id="copy-btn"
                        className="px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider bg-[#0a0a0a]/80 hover:bg-[#f39b34] text-white hover:text-black transition-all rounded-sm cursor-pointer backdrop-blur-sm"
                        title="Copy photo URL"
                      >
                        Copy URL
                      </button>
                    </div>
                  )}
                </div>

                {/* Thumbnail strip — all photos from Photo attachment field */}
                {(() => {
                  const allPhotos = [
                    ...(isValidImageUrl(selectedCollection.productPhotoUrl) ? [{ url: selectedCollection.productPhotoUrl, filename: "product-photo" }] : []),
                    ...(((selectedCollection as any).photos || []).filter((p: any) => isValidImageUrl(p?.url))),
                  ];
                  if (allPhotos.length <= 1) return null;
                  return (
                    <div className="flex gap-1.5 p-2 overflow-x-auto bg-[#0a0a0a]/60 backdrop-blur-sm scrollbar-hide">
                      {allPhotos.map((photo: any, i: number) => (
                        <button
                          key={i}
                          onClick={() => setActivePhoto(photo.url)}
                          className={`flex-shrink-0 w-14 h-14 rounded-sm overflow-hidden border-2 transition-all cursor-pointer ${
                            activePhoto === photo.url
                              ? "border-[#f39b34] opacity-100"
                              : "border-transparent opacity-55 hover:opacity-90"
                          }`}
                        >
                          <img
                            src={isValidImageUrl(photo.url) ? photo.url : PLACEHOLDER_IMG}
                            alt={`Photo ${i + 1}`}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              const el = e.target as HTMLImageElement;
                              if (el.src !== PLACEHOLDER_IMG) el.src = PLACEHOLDER_IMG;
                            }}
                          />
                        </button>
                      ))}
                    </div>
                  );
                })()}
              </div>

              {/* Right Side: Specifications Panel */}
              <div className="p-6 md:p-8 flex flex-col justify-between bg-[#FAF9F6] md:overflow-y-auto md:max-h-[90vh]">
                <div>
                  <div className="flex justify-between items-center pb-4 border-b border-neutral-200 mb-6">
                    <div>
                      <h4 className="font-sans text-sm font-bold text-[#1C1A17] tracking-wide">
                        {selectedCollection.name}
                      </h4>
                    </div>
                    <button
                      onClick={() => setSelectedCollection(null)}
                      className="hidden md:flex p-2 hover:bg-neutral-100 rounded text-neutral-400 hover:text-[#1C1A17] transition-colors cursor-pointer"
                    >
                      <X size={16} />
                    </button>
                  </div>

                  {/* Surface attributes */}
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="border border-[#f39b34]/30 p-3 rounded bg-[#f39b34]/05 flex flex-col justify-center">
                      <span className="text-[10px] font-bold text-[#f39b34] uppercase tracking-wide leading-tight">
                        Contact us for sizes
                      </span>
                    </div>

                    <div className="border border-neutral-200/60 p-3 rounded bg-white">
                      <span className="text-[9px] font-mono tracking-widest text-[#1C1A17]/40 uppercase block mb-1">
                        THICKNESS SPEC
                      </span>
                      <span className="text-xs text-[#1C1A17] font-sans uppercase">
                        {selectedCollection.thickness || getThickness(selectedCollection)}
                      </span>
                    </div>
                  </div>

                  {/* Production Properties List */}
                  <div className="border border-neutral-200/60 p-3.5 rounded bg-white space-y-2.5 mb-6 shadow-sm">
                    <div className="flex justify-between items-center text-[10px] border-b border-neutral-100 pb-1.5">
                      <span className="text-[#1C1A17]/40 uppercase font-mono">Material Style:</span>
                      <span className="text-teal-700 font-sans font-semibold">{selectedCollection.specificMaterialStyle || getMaterialStyle(selectedCollection)}</span>
                    </div>
                    <div className="flex justify-between items-center text-[10px] border-b border-neutral-100 pb-1.5">
                      <span className="text-[#1C1A17]/40 uppercase font-mono">Finish:</span>
                      <span className="text-sky-700 font-sans font-semibold">{selectedCollection.finish}</span>
                    </div>

                    {/* Extra Airtable Custom Fields */}
                    {selectedCollection.brand && (
                      <div className="flex justify-between items-center text-[10px] border-t border-neutral-100 pt-1.5">
                        <span className="text-[#1C1A17]/40 uppercase font-mono">Brand:</span>
                        <span className="text-[#1C1A17]/80 font-mono">{selectedCollection.brand}</span>
                      </div>
                    )}
                    {selectedCollection.unit && (
                      <div className="flex justify-between items-center text-[10px] border-t border-neutral-100 pt-1.5">
                        <span className="text-[#1C1A17]/40 uppercase font-mono">Sold By:</span>
                        <span className="text-[#1C1A17]/80 font-mono">{selectedCollection.unit}</span>
                      </div>
                    )}
                    {selectedCollection.sqFtPerUnit !== undefined && selectedCollection.sqFtPerUnit !== null && (
                      <div className="flex justify-between items-center text-[10px] border-t border-neutral-100 pt-1.5">
                        <span className="text-[#1C1A17]/40 uppercase font-mono">SqFt per Unit:</span>
                        <span className="text-[#1C1A17]/80 font-mono">{selectedCollection.sqFtPerUnit}</span>
                      </div>
                    )}
                    {selectedCollection.sqFtPerBox !== undefined && selectedCollection.sqFtPerBox !== null && (
                      <div className="flex justify-between items-center text-[10px] border-t border-neutral-100 pt-1.5">
                        <span className="text-[#1C1A17]/40 uppercase font-mono">SqFt per Box:</span>
                        <span className="text-[#1C1A17]/80 font-mono">{selectedCollection.sqFtPerBox}</span>
                      </div>
                    )}
                    {selectedCollection.stockQuantities !== undefined && selectedCollection.stockQuantities !== null && (
                      <div className="flex justify-between items-center text-[10px] border-t border-neutral-100 pt-1.5">
                        <span className="text-[#1C1A17]/40 uppercase font-mono">Stock Quantities:</span>
                        <span className="text-emerald-600 font-mono font-bold">{selectedCollection.stockQuantities}</span>
                      </div>
                    )}
                    {selectedCollection.price && (
                      <div className="flex justify-between items-center text-[10px] border-t border-neutral-100 pt-1.5">
                        <span className="text-[#1C1A17]/40 uppercase font-mono">Price fields:</span>
                        <span className="text-[#f39b34] font-mono font-bold">{selectedCollection.price}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-3 pt-4 border-t border-neutral-200 mt-auto">
                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        onTogglePreSelection(selectedCollection);
                      }}
                      className={`flex-grow py-3 text-xs font-sans font-bold tracking-widest uppercase transition-colors duration-300 text-center cursor-pointer rounded-sm ${
                        selectedSlabIds.includes(selectedCollection.id)
                          ? "bg-transparent border border-[#f39b34] text-[#f39b34] hover:bg-[#f39b34]/10"
                          : "bg-[#f39b34] hover:bg-[#e28b24] text-white"
                      }`}
                    >
                      {selectedSlabIds.includes(selectedCollection.id)
                        ? "✓ Pre-Selected (Remove)"
                        : "+ Pre-Select Slab Model"}
                    </button>
                    
                    <button
                      onClick={() => {
                        setSelectedCollection(null);
                        onBookClick();
                      }}
                      className="px-5 py-3 border border-[#f39b34]/30 bg-white hover:bg-[#f39b34] text-[#f39b34] hover:text-white text-xs font-sans font-semibold tracking-widest uppercase transition-colors duration-300 text-center cursor-pointer rounded-sm"
                    >
                      Contact Us
                    </button>
                  </div>
                  
                  <button
                    onClick={() => setSelectedCollection(null)}
                    className="w-full py-2 border border-neutral-200 hover:border-red-500/20 text-[9px] tracking-widest font-mono text-neutral-400 hover:text-[#1C1A17] transition-all cursor-pointer text-center uppercase"
                  >
                    Close Specifications
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
    </>
  );
}

// ==========================================
// FALLBACK UTILITY GENERATORS FOR HIGH DENSITY CATALOG
// ==========================================

const getLifestyleImage = (col: Collection): string => {
  if (col.productPhotoUrl) return col.productPhotoUrl;
  const images: Record<string, string> = {
    "calacatta-gold": "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80",
    "nero-marquina": "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=800&q=80",
    "travertine": "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=800&q=80",
    "statuario-extra": "https://images.unsplash.com/photo-1507652313519-d4e9174996dd?auto=format&fit=crop&w=800&q=80",
    "roma-imperial": "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80",
    "frappuccino-marble": "https://images.unsplash.com/photo-1540518614846-7eded433c457?auto=format&fit=crop&w=800&q=80",
    "arabescato-orobico": "https://images.unsplash.com/photo-1502005229762-fc1b2d812ca5?auto=format&fit=crop&w=800&q=80",
    "concrete-series": "https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=800&q=80",
    "quartzite-corteccia": "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=800&q=80",
    "patagonie": "https://images.unsplash.com/photo-1512915922686-57c11dde9b6b?auto=format&fit=crop&w=800&q=80",
    "dual-white": "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=800&q=80",
    "nature-mood-rainforest": "https://images.unsplash.com/photo-1530745342582-0795f23ec976?auto=format&fit=crop&w=800&q=80",
    "nature-mood-mountain-peak": "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&w=800&q=80",
    "nature-mood-riverbed": "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=800&q=80",
    "distrito-iron": "https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=800&q=80",
    "distrito-iron-natural": "https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=800&q=80",
    "distrito-zinc-natural": "https://images.unsplash.com/photo-1530745342582-0795f23ec976?auto=format&fit=crop&w=800&q=80",
    "distrito-aluminio-natural": "https://images.unsplash.com/photo-1590381105924-c72589b9ef3f?auto=format&fit=crop&w=800&q=80",
    "jw02-washington-polished": "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80",
    "jw02-nero-marquinia-polished": "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=800&q=80",
    "jw02-statuario-venato-polished": "https://images.unsplash.com/photo-1507652313519-d4e9174996dd?auto=format&fit=crop&w=800&q=80",
    "ankara-bronze": "https://images.unsplash.com/photo-1618219908412-a29a1bb7b86e?auto=format&fit=crop&w=800&q=80",
    "arken-gris": "https://images.unsplash.com/photo-1590381105924-c72589b9ef3f?auto=format&fit=crop&w=800&q=80"
  };
  return col.id && images[col.id] ? images[col.id] : "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80";
};

const getFinishAndFeel = (col: Collection): string => {
  if (col.finishAndFeel) return col.finishAndFeel;
  if (col.finish === "Polished") return "Polished/High Gloss";
  if (col.finish === "Matte") return "Smooth Matte";
  if (col.finish === "Silk") return "Velvet Silk";
  if (col.finish === "Textured") return "Structured Grip";
  return "Satin Tactile";
};

const getColorGroup = (col: Collection): string => {
  return col.colorGroup || "";
};

const getThickness = (col: Collection): string => {
  if (col.thickness) return col.thickness;
  if (col.category === "Marble Look") return "6 mm";
  if (col.category === "Stone Look") return "12 mm";
  if (col.category === "Concrete Look") return "5.6 mm";
  if (col.category === "Metal Look") return "5.6 mm";
  return "6 mm";
};

const getVisualLook = (col: Collection): string => {
  if (col.visualLook) return col.visualLook;
  if (col.category === "Metal Look") return "Metal & Oxid Look";
  return col.category;
};

const getMaterialStyle = (col: Collection): string => {
  if (col.specificMaterialStyle) return col.specificMaterialStyle;
  const id = col.id;
  if (id.includes("calacatta")) return "Calacatta Gold";
  if (id.includes("nero")) return "Nero Marquina";
  if (id.includes("statuario")) return "Statuario";
  if (id.includes("travertine")) return "Travertine";
  if (id.includes("roma")) return "Quartzite";
  if (id.includes("frappuccino")) return "Frappuccino";
  if (id.includes("orobico")) return "Arabescato";
  if (id.includes("concrete")) return "Concrete Style";
  if (id.includes("patagonie")) return "Patagonia";
  if (id.includes("nature")) return "Nature Slabs";
  if (id.includes("distrito")) return "Metal";
  if (id.includes("ankara")) return "Bronze";
  if (id.includes("arken")) return "Basaltic";
  return "Bespoke";
};

const getProductPhotoUrl = (col: Collection): string => {
  if (col.productPhotoUrl) return col.productPhotoUrl;
  return `https://media.italgresorlando.com/productos/${col.id.replace(/-/g, "_")}_list.webp`;
};
