import { ROLES } from "./roles"
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faArrowsToCircle,
    faBed,
    faCalendarAlt,
    faCartFlatbedSuitcase,
    faChartLine,
    faEnvelope,
    faHome,
    faHotel,
    faInfoCircle,
    faRightFromBracket,
    faScaleBalanced,
    faUserSecret,
    faUsers
} from '@fortawesome/free-solid-svg-icons';


export const headerLinks = [
    {
        name: "nav.home",
        path: '/',
        icon: <FontAwesomeIcon icon={faHome} />,
        access: [ROLES.Guest]
    },
    {
        name: "nav.apartments",
        path: '/rooms',
        icon: <FontAwesomeIcon icon={faHotel} />,
        access: [ROLES.Guest]
    },
    {
        name: "nav.activities",
        path: '/activities',
        icon: <FontAwesomeIcon icon={faInfoCircle} />,
        access: [ROLES.Guest]
    },
    {
        name: "nav.about",
        path: '/about',
        icon: <FontAwesomeIcon icon={faHome} />,
        access: [ROLES.Guest]
    },
    {
        name: "nav.contact-us",
        path: '/contact-us',
        icon: <FontAwesomeIcon icon={faEnvelope} />,
        access: [ROLES.Guest]
    }
]

export const footerLinks = [
    {
        name: "nav.log-in",
        path: "/login",
        icon: <FontAwesomeIcon icon={faRightFromBracket} />,
        access: [ROLES.Guest]
    },
    {
        name: "nav.legal-notice",
        path: "/legal-notice",
        icon: <FontAwesomeIcon icon={faScaleBalanced} />,
        access: [ROLES.Guest]
    },
    {
        name: "nav.privacy-policy",
        path: "/privacy-policy",
        icon: <FontAwesomeIcon icon={faUserSecret} />,
        access: [ROLES.Guest]
    }

]

export const privateLinks = [
    {
        name: "nav.dashboard",
        path: '/private/dashboard',
        icon: <FontAwesomeIcon icon={faChartLine} />,
        access: [ROLES.Host, ROLES.Manager, ROLES.Admin]
    },
    {
        name: "nav.apartments",
        path: '/private/apartments',
        icon: <FontAwesomeIcon icon={faHotel} />,
        access: [ROLES.Manager]
    },
    {
        name: "nav.channels",
        path: '/private/channels',
        icon: <FontAwesomeIcon icon={faArrowsToCircle} />,
        access: [ROLES.Manager]
    },
    {
        name: "nav.users",
        path: '/private/users',
        icon: <FontAwesomeIcon icon={faUsers} />,
        access: [ROLES.Admin]
    },
    {
        name: "nav.clients",
        path: '/private/clients',
        icon: <FontAwesomeIcon icon={faBed} />,
        access: [ROLES.Host, ROLES.Manager]
    },
    {
        name: "nav.bookings",
        path: '/private/bookings',
        icon: <FontAwesomeIcon icon={faCartFlatbedSuitcase} />,
        access: [ROLES.Host, ROLES.Manager]
    },
    {
        name: "nav.calendar",
        path: '/private/calendar',
        icon: <FontAwesomeIcon icon={faCalendarAlt} />,
        access: [ROLES.Guest, ROLES.Host, ROLES.Manager]
    }
]

export const monthNames = [
    "months.jan",
    "months.feb",
    "months.mar",
    "months.apr",
    "months.may",
    "months.jun",
    "months.jul",
    "months.aug",
    "months.sep",
    "months.oct",
    "months.nov",
    "months.dec"
]
export const dayNames = [
    "days.mon",
    "days.tue",
    "days.wed",
    "days.thu",
    "days.fri",
    "days.sat",
    "days.sun"
]
export const dayNamesLong = [
    "days.monday",
    "days.tuesday",
    "days.wednesday",
    "days.thursday",
    "days.friday",
    "days.saturday",
    "days.sunday"
]

export const activities = [
    {
        name: "Cova de Sant Ignasi",
        bg: "/assets/images/cueva-de-san-ignacio.jpg",
        text: "En uno de los abrigos rocosos tan característicos del paisaje de Manresa, a resguardo de los Elementos pero con una magnífica vista panorámica de la montaña de Montserrat y del río Cardener, San Ignacio de Loyola pasó una temporada meditando y escribiendo la primera versión de sobre célebres Ejercicios Espirituales. Con el paso de los años, esta sencilla cuevecita se acaba convirtiéndo en el edificio más monumental y fastuoso de la ciudad. El imponente santuario erigido sobre la roca original  se ha convertido, de manera indiscutible, en el Lugar ignaciano miedo excelencia de Manresa, además de ser uno de las referentes más universales del mundo jesuítico. En el Santuario de la Cueva de San Ignacio, paisaje y arquitectura se fusionan de manera Sorprendente, Creando un conjunto verdaderamente único."
    },
    {
        name: "Santa Maria de la Seu",
        bg: "/assets/images/Basilica-Santa-Maria-De-La-Seu.jpg",
        text: "La Basílica Colegiata de Santa María de Manresa, conocida popularmente como «La Seu«, es el principal monumento de nuestra ciudad. La visita a La Seu también resulta de gran interés por las importantes piezas artísticas obras de arte que conserva en su interior. Del imponente conjunto de retablos góticos que se encuentran expuestos en las capillas laterales de la nave, sobresale el Retablo del Espiritu Santo (1394), obra del taller de los hermanos Serra de Barcelona y uno de los mejores ejemplos del estilo gótico italianizante en Cataluña."
    },
    {
        name: "Pont Vell",
        bg: "/assets/images/pont-vell-manresa.jpg",
        text: "El Pont Vell (Puente Viejo) es un puente de ocho arcos y medio que cruza el río Cardener a la entrada suroeste de Manresa. Los cimientos de sus arcos centrales tienen sus orígenes en el siglo XII, aunque tradicionalmente se consideraba que su origen se podría remontar a finales de la época romana. El puente tomó su forma actual entre los siglos XII y XIV, durante una reforma general que se dio en plena época de expansión económica y de población."
    },
    {
        name: "Parc de la Sèquia",
        bg: "/assets/images/parc-de-la-sequia-manresa.jpg",
        text: "Con el objetivo de superar la terrible sequía que Manresa sufría a mediados del siglo XIV, las autoridades locales decidieron construir la Sèquia, un canal hidráulico y de regadío que pudiese abastecer permanentemente la ciudad con el agua del río Llobregat. Su trazado de 26 quilómetros y solamente 10 metros de desnivel, tiene su inicio en la conocida “resclosa dels manresans” (“presa de los manresanos”) situada en el municipio de Balsareny. "
    },
    {
        name: "Casa Torrents",
        bg: "/assets/images/casa-torrents-manresa.jpg",
        text: "La casa Torrents, situada en la plaza de Fius i Palà, es un gran edificio residencial modernista diseñado por el arquitecto manresano Ignasi Oms i Ponsa en 1908. Su construcción fue encargada por Leodegario Torrents, miembro de la familia de empresarios industriales Torrents, unos auténticos pioneros de la industrialización de Manresa y de su comarca.  Su esposa, Antonia Burés, también provenía de uno de los linajes industriales más ilustres de la ciudad, los Burés, propietarios de fábricas y colonias industriales a lo largo del Llobregat y del Ter. El nombre popular del edificio deriva precisamente de dicho apellido: La Buresa."
    },
    {
        name: "Plana de l'Om",
        bg: "/assets/images/pla-del-om-manresa.jpg",
        text: "La Plana de l'Om es una plaza que se encuentra en el corazón del centro histórico de Manresa. Su nombre hace referencia al imponente olmo (Ulmus minor) que la preside desde hace décadas. Tanto por su localización como por los establecimientos y edificios que la rodean es una de las plazas más transitadas de la ciudad. Situada en la esquina que converge con la calle del Born se encuentra la farmacia Esteve, un ejemplo modélico de establecimiento comercial decorado según los cánones modernistas: vitrales de colores, madera trabajada y hierro forjado. Finalmente, a los pies del olmo que preside la plaza se puede admirar la escultura “A l'ombra” (A la sombra), del escultor local Ramón Oms. La pieza representa una mujer sentada en un banco a la sombra del árbol, con un libro en las manos."
    },
    {
        name: "Pont Nou",
        bg: "/assets/images/pont-nou-manresa.jpg",
        text: "El Pont Nou (Puente Nuevo) es un puente de ocho arcos de medio punto que cruza el río Cardener a la entrada nordeste de Manresa. Se construyó a principios del siglo XIV, bajo la dirección de obras del célebre maestro Berenguer de Montagut.  En aquello momentos, Montagut se encontraba inmerso en una auténtica renovación de los edificios religiosos de la ciudad, diseñando la basílica de La Seu o la iglesia del Carme, otras dos joyas del pasado gótico manresano. En el momento de su finalización el puente tenía nueve arcos, aunque a día de hoy solamente se conservan ocho de ellos. Su paso formaba parte del camino real que unía las ciudades de Manresa y Lleida. Se trata de uno  de los puentes medievales más largos y mejor conservados de Cataluña. "
    },
    {
        name: "Parròquia del Carme",
        bg: "/assets/images/el-carme-manresa.jpg",
        text: "La iglesia del Carmen  es un templo  de origen gótico , diseñado por el maestro de obras Berenguer de Montagut y construido originalmente a mediados del siglo XIV. Se trata de una iglesia con estructura de nave única, con capillas laterales y bóvedas de crucería. En su fachada original se podía observar un pequeño óculo situado sobre el portal principal por donde, según la tradición popular, el 21 de febrero de 1345 hay penetró la misteriosa luz protagonista del célebre  Milagro de la Luz . "
    },
    {
        name: "Capella del Rapte",
        bg: "/assets/images/el-rapte-manresa.jpg",
        text: "La capilla del Rapto de San Ignacio , es un espacio de culto que se encuentra en la plaza de San Ignacio. La actual capilla se sitúa en las dependencias del antiguo Hospital Inferior o de Santa Lucía , de origen medieval, donde San Ignacio de Loyola solía hospedarse durante sus primeros meses en Manresa. Desde mediados del siglo XIV, junto al hospital se levantaba la capilla de Santa Lucía, que actuaba como capilla privada del gremio de albañiles y canteros. Se puede acceder al interior de la capilla con la visita guiada  » Manresa universal: La ciudad de San Ignacio «  o bien solicitando el acceso al Centro de Acogida de Peregrinos .",
    },
    {
        name: "Museo de la Técnica",
        bg: "/assets/images/museu-tecnica-de-manresa.jpg",
        text: "El Museo de la Técnica de Manresa es un espacio museográfico que se encuentra situado en el antiguo recinto del edificio monumental conocido como «Depósitos Viejos». Las enormes cisternas que se encontraban dentro de la edificación almacenaban el agua de la Acequia. Fueron construidos entre los años 1861 y 1865 por el maestro de obras de origen aragonés Mariano poto y sirvieron para proveer la primera red de distribución de agua de nuestra ciudad.",
    },
    {
        name: "Pont de les Arnaules",
        bg: "/assets/images/pont-arnaules.jpg",
        text: "el Pont Foradat de les Arnaules, puente de roca natural de gran importancia geológica, de unos 40 años millones de antigüedad. Hace 27 metros de longitud, de los cuales 13’2 corresponden al tramo vacío por los lados, mas 2’7 metros de ancho con una altura desde el arroyo de 10’7 metros.",
    },
    {
        name: "Casa Lluvià",
        bg: "/assets/images/casa-lluvia.jpg",
        text: "La casa Lluvià es una vivienda unifamiliar con jardín que Se encuentra en la calle del arquitecto Oms, al lado del paseo de Pedro III en pleno centro de la ciudad. Fué proyectada por el arquitecto modernista Ignasi Oms i Ponsa 1908 por encargo del empresario Sebastián Tàpies. Se trata de una de las mejores obras del arquitecto, donde despliega un estilo mucho más maduro, abrazando plenamente la inventiva modernista. Pocos años más tarde FUE adquirida por Lluís Lluvià, Miembro del ilustre linaje de propietarios industriales manresanos. El edificio Adquiriré sume denominación actual en este momento.",
    }
]
export const heroImages = [
    {
        filename: "/assets/images/IXA-1_04.jpg",
        alt: 'Image 1'
    },
    {
        filename: "/assets/images/IXA-2_11.jpg",
        alt: 'Image 2'
    },
    {
        filename: "/assets/images/IXA-6_11.jpg",
        alt: 'Image 3'
    }
]

export const apartments = [
    {
        name: "IXA-1",
        maxGuests: 6,
        rooms: 3,
        bathrooms: 1,
        price: 120,
        description: "",
        bg: "/assets/images/IXA-1_05.jpg",
        features: [
            "features.tv",
            "features.bedsheets",
            "features.towels",
            "features.laundry",
            "features.ac",
            "features.parking",
            "features.kitchen",
            "features.terrace",
        ],
    },
    {
        name: "IXA-2",
        maxGuests: 4,
        rooms: 3,
        bathrooms: 2,
        price: 115,
        description: "",
        bg: "/assets/images/IXA-2_11.jpg",
        features: [
            "features.tv",
            "features.bedsheets",
            "features.towels",
            "features.laundry",
            "features.ac",
            "features.kitchen",
            "features.balcony",
        ],
    },
    {
        name: "IXA-3",
        maxGuests: 6,
        rooms: 3,
        bathrooms: 2,
        price: 120,
        description: "",
        bg: "/assets/images/IXA-3_01.jpg",
        features: [
            "features.tv",
            "features.bedsheets",
            "features.towels",
            "features.laundry",
            "features.ac",
            "features.parking",
            "features.kitchen",
        ],
    },
    {
        name: "IXA-6",
        maxGuests: 4,
        rooms: 2,
        bathrooms: 1,
        price: 120,
        description: "",
        bg: "/assets/images/IXA-6_01.jpg",
        features: [
            "features.tv",
            "features.bedsheets",
            "features.towels",
            "features.laundry",
            "features.ac",
            "features.kitchen",
            "features.balcony",
        ],
    }
]

export const languages = [
    {
        value: "en",
        name: "English"
    },
    {
        value: "es",
        name: "Español"
    },
    {
        value: "fr",
        name: "Français"
    },
    {
        value: "de",
        name: "Deutsch"
    },
    {
        value: "ru",
        name: "Русский"
    },
    {
        value: "pt",
        name: "Português"
    },
    {
        value: "ca",
        name: "Català"
    }
]
